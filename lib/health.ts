/**
 * What the iOS Shortcut sends from Apple Health, cleaned up and checked.
 *
 * Shortcuts is loose about types: a number can arrive as 8423, "8,423" or "312 kcal", a duration as
 * 45, "45 min", "1 hr 5 min" or "0:45:12", and energy may be in kilojoules if Health is set that way.
 * Everything is read tolerantly, and anything that can't be understood is reported rather than
 * silently stored wrong.
 */
import { addDays, isLogDate, todayLogDate, toLogDate, type LogDate } from "./time";

/** How many days back a sync may write, so a late sync can still fill yesterday. */
export const MAX_BACKFILL_DAYS = 7;
export const MAX_WORKOUTS_PER_SYNC = 50;
const MAX_STEPS = 200_000;
const MAX_KCAL = 20_000;

/** The first number in a value: 8423, "8,423", "8423.5", "312 kcal". Null if there isn't one. */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/** Energy in kilocalories. Reads kilojoules when the text says so (1 kcal = 4.184 kJ). */
export function parseKcal(value: unknown): number | null {
  const n = parseNumber(value);
  if (n === null) return null;
  if (typeof value === "string" && /\bk\s?j\b|kilojoule/i.test(value)) return n / 4.184;
  return n;
}

/** A duration in minutes. A bare number means minutes. */
export function parseDurationMin(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().toLowerCase();
  if (!text) return null;

  // 1:05:30 is hours:minutes:seconds, 45:12 is minutes:seconds.
  const clock = text.match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (clock) {
    const [, a, b, c] = clock;
    return c === undefined ? Number(a) + Number(b) / 60 : Number(a) * 60 + Number(b) + Number(c) / 60;
  }

  let minutes = 0;
  let found = false;
  for (const [, amount, unit] of text.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g)) {
    found = true;
    const n = Number(amount);
    if (unit!.startsWith("h")) minutes += n * 60;
    else if (unit!.startsWith("m")) minutes += n;
    else minutes += n / 60;
  }
  if (found) return minutes > 0 ? minutes : null;

  const bare = parseNumber(text);
  return bare !== null && bare > 0 ? bare : null;
}

export interface SyncWorkout {
  /** Stable for the same workout, so syncing twice does not log it twice. */
  externalId: string;
  name: string;
  /** ISO timestamp. */
  startedAt: string;
  durationMin: number | null;
  calories: number;
}

export interface SyncPayload {
  date: LogDate;
  /** Null when the sync did not include it, so an earlier value is kept. */
  steps: number | null;
  activeKcal: number | null;
  workouts: SyncWorkout[];
  /** Workouts that were left out (unreadable, or too old). */
  skippedWorkouts: number;
}

export type SyncError =
  | "invalid_body"
  | "invalid_date"
  | "invalid_steps"
  | "invalid_active_kcal"
  | "nothing_to_sync";

export type ParseResult = { ok: true; value: SyncPayload } | { ok: false; error: SyncError };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** The first of these keys that is present, so the Shortcut can use whichever name it likes. */
function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
  return undefined;
}

function parseWorkout(raw: unknown, oldest: LogDate, newest: LogDate): SyncWorkout | null {
  if (!isRecord(raw)) return null;
  const startRaw = pick(raw, ["startedAt", "start", "startDate", "date"]);
  const startMs = typeof startRaw === "string" ? Date.parse(startRaw) : typeof startRaw === "number" ? startRaw : NaN;
  if (!Number.isFinite(startMs)) return null;
  const started = new Date(startMs);
  const day = toLogDate(started);
  if (day < oldest || day > newest) return null;

  const nameRaw = pick(raw, ["name", "type", "workout"]);
  const name = (typeof nameRaw === "string" ? nameRaw.trim() : "").slice(0, 200) || "Workout";
  const minutes = parseDurationMin(pick(raw, ["durationMin", "duration", "minutes"]));
  const kcal = parseKcal(pick(raw, ["calories", "kcal", "activeKcal", "energy", "activeEnergy"]));

  return {
    externalId: `${started.toISOString()}|${name.toLowerCase()}`,
    name,
    startedAt: started.toISOString(),
    durationMin: minutes === null ? null : Math.min(1440, Math.max(1, Math.round(minutes))),
    calories: kcal === null ? 0 : Math.min(MAX_KCAL, Math.max(0, Math.round(kcal))),
  };
}

/**
 * Check and clean a sync request body. `date` is optional and defaults to today in Malaysia, so
 * the phone's clock and time zone never decide which day the numbers belong to.
 */
export function parseSyncPayload(body: unknown, now: Date = new Date()): ParseResult {
  if (!isRecord(body)) return { ok: false, error: "invalid_body" };

  const today = todayLogDate(now);
  const oldest = addDays(today, -MAX_BACKFILL_DAYS);
  const dateRaw = body.date;
  let date = today;
  if (dateRaw !== undefined && dateRaw !== null && dateRaw !== "") {
    if (typeof dateRaw !== "string" || !isLogDate(dateRaw) || dateRaw > today || dateRaw < oldest) {
      return { ok: false, error: "invalid_date" };
    }
    date = dateRaw;
  }

  let steps: number | null = null;
  const stepsRaw = pick(body, ["steps"]);
  if (stepsRaw !== undefined) {
    const n = parseNumber(stepsRaw);
    if (n === null || n < 0 || n > MAX_STEPS) return { ok: false, error: "invalid_steps" };
    steps = Math.round(n);
  }

  let activeKcal: number | null = null;
  const kcalRaw = pick(body, ["activeKcal", "activeEnergy", "calories"]);
  if (kcalRaw !== undefined) {
    const n = parseKcal(kcalRaw);
    if (n === null || n < 0 || n > MAX_KCAL) return { ok: false, error: "invalid_active_kcal" };
    activeKcal = Math.round(n);
  }

  const rawWorkouts = Array.isArray(body.workouts) ? body.workouts.slice(0, MAX_WORKOUTS_PER_SYNC) : [];
  const workouts: SyncWorkout[] = [];
  const seen = new Set<string>();
  for (const raw of rawWorkouts) {
    const workout = parseWorkout(raw, oldest, today);
    if (!workout || seen.has(workout.externalId)) continue;
    seen.add(workout.externalId);
    workouts.push(workout);
  }

  if (steps === null && activeKcal === null && workouts.length === 0) return { ok: false, error: "nothing_to_sync" };
  return { ok: true, value: { date, steps, activeKcal, workouts, skippedWorkouts: rawWorkouts.length - workouts.length } };
}
