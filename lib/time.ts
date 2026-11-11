/**
 * Malaysia time (Asia/Kuala_Lumpur) helpers.
 *
 * Snapplate decides what "today" is in Malaysia time everywhere: in the
 * browser, on the Vercel server (UTC) and in the database. Nothing else in the
 * codebase should call getDate/getHours/toLocaleDateString to decide a day.
 *
 * Malaysia has no daylight saving and is always UTC+8, so a fixed offset is
 * exact and works the same on any machine timezone.
 *
 * A "log date" is a plain calendar date string, "YYYY-MM-DD", in Malaysia time.
 */

export const APP_TIME_ZONE = "Asia/Kuala_Lumpur";
export const MYT_OFFSET_MINUTES = 8 * 60;

const MYT_OFFSET_MS = MYT_OFFSET_MINUTES * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LOG_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type LogDate = string;

type DateInput = Date | number | string;

function toMs(input: DateInput): number {
  const ms = input instanceof Date ? input.getTime() : new Date(input).getTime();
  if (Number.isNaN(ms)) throw new RangeError(`Invalid date: ${String(input)}`);
  return ms;
}

/** Parse a log date into its parts, validating it is a real calendar date. */
export function parseLogDate(logDate: LogDate): { year: number; month: number; day: number } {
  const match = LOG_DATE_RE.exec(logDate);
  if (!match) throw new RangeError(`Invalid log date: ${logDate}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid log date: ${logDate}`);
  }
  return { year, month, day };
}

export function isLogDate(value: string): boolean {
  try {
    parseLogDate(value);
    return true;
  } catch {
    return false;
  }
}

/** The Malaysia calendar date of an instant. */
export function toLogDate(input: DateInput): LogDate {
  return new Date(toMs(input) + MYT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Today's log date in Malaysia time. Pass `now` in tests. */
export function todayLogDate(now: DateInput = new Date()): LogDate {
  return toLogDate(now);
}

/** Minutes since midnight in Malaysia time (0-1439). */
export function minutesSinceMidnight(now: DateInput = new Date()): number {
  const local = new Date(toMs(now) + MYT_OFFSET_MS);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

/** The instant at which a log date starts: 00:00 Malaysia time. */
export function startOfLogDate(logDate: LogDate): Date {
  const { year, month, day } = parseLogDate(logDate);
  return new Date(Date.UTC(year, month - 1, day) - MYT_OFFSET_MS);
}

/** Exclusive end of a log date: the start of the next one. Use for range queries. */
export function endOfLogDate(logDate: LogDate): Date {
  return new Date(startOfLogDate(logDate).getTime() + DAY_MS);
}

/** How many days a month has (month is 1 to 12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Build a log date from parts, clamping the day to what the month allows. */
export function makeLogDate(year: number, month: number, day: number): LogDate {
  const d = Math.min(day, daysInMonth(year, month));
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Add (or subtract) whole days to a log date. */
export function addDays(logDate: LogDate, days: number): LogDate {
  const { year, month, day } = parseLogDate(logDate);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: LogDate, to: LogDate): number {
  const a = parseLogDate(from);
  const b = parseLogDate(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS,
  );
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(logDate: LogDate): number {
  const { year, month, day } = parseLogDate(logDate);
  const sundayFirst = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (sundayFirst + 6) % 7;
}

/** Monday of the week that contains `logDate`. */
export function startOfWeek(logDate: LogDate): LogDate {
  return addDays(logDate, -weekdayIndex(logDate));
}

/** The seven log dates (Monday to Sunday) of the week that contains `logDate`. */
export function weekDates(logDate: LogDate): LogDate[] {
  const monday = startOfWeek(logDate);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Inclusive list of log dates between two dates. */
export function dateRange(from: LogDate, to: LogDate): LogDate[] {
  const count = diffDays(from, to);
  if (count < 0) return [];
  return Array.from({ length: count + 1 }, (_, i) => addDays(from, i));
}

/** Whole years between a date of birth and a log date (birthday-aware). */
export function ageOn(dateOfBirth: LogDate, on: LogDate): number {
  const dob = parseLogDate(dateOfBirth);
  const ref = parseLogDate(on);
  let age = ref.year - dob.year;
  if (ref.month < dob.month || (ref.month === dob.month && ref.day < dob.day)) age -= 1;
  return age;
}

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: APP_TIME_ZONE,
});

function noonUtc(logDate: LogDate): Date {
  const { year, month, day } = parseLogDate(logDate);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

const shortFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A log date as day and month, e.g. "3 Nov". */
export function formatShortDate(logDate: LogDate): string {
  return shortFormatter.format(noonUtc(logDate));
}

/** A log date with the year, e.g. "3 Nov 2026". */
export function formatLongDate(logDate: LogDate): string {
  return longFormatter.format(noonUtc(logDate));
}

/** A log date written out, e.g. "Tue, 3 Nov". */
export function formatDate(logDate: LogDate): string {
  return dayFormatter.format(noonUtc(logDate));
}

/** "Today", "Yesterday", "Tomorrow", otherwise e.g. "Mon, 3 Nov". */
export function formatDayLabel(logDate: LogDate, today: LogDate = todayLogDate()): string {
  const delta = diffDays(today, logDate);
  if (delta === 0) return "Today";
  if (delta === -1) return "Yesterday";
  if (delta === 1) return "Tomorrow";
  return formatDate(logDate);
}

/** Short weekday name, e.g. "Mon". */
export function formatWeekday(logDate: LogDate): string {
  return weekdayFormatter.format(noonUtc(logDate));
}

/** Clock time of an instant in Malaysia time, e.g. "1:05 pm". */
export function formatClockTime(input: DateInput): string {
  return timeFormatter.format(new Date(toMs(input))).toLowerCase();
}
