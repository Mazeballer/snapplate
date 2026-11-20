import { NextResponse, type NextRequest } from "next/server";
import { parseSyncPayload, type SyncError } from "@/lib/health";
import { getSupabaseEnv } from "@/lib/supabase/env";

// A Shortcut is short on patience; the database call is quick.
export const maxDuration = 15;

const MESSAGES: Record<SyncError | "missing_token" | "invalid_token" | "not_allowed" | "invalid_value" | "unavailable", string> = {
  missing_token: "Send your key as: Authorization: Bearer <key>.",
  invalid_token: "That key isn't valid. Make a new one in Settings, Apple Health.",
  not_allowed: "This account isn't allowed to use the app.",
  invalid_body: "Send a JSON object with steps, activeKcal and workouts.",
  invalid_date: "date must be a day in the last 7 days, like 2026-11-15.",
  invalid_steps: "steps must be a number.",
  invalid_active_kcal: "activeKcal must be a number.",
  invalid_value: "A number was out of range.",
  nothing_to_sync: "Nothing to sync: send steps, activeKcal or workouts.",
  unavailable: "Couldn't reach the database. Try again in a moment.",
};

function respond(error: keyof typeof MESSAGES, status: number) {
  return NextResponse.json({ ok: false, error, message: MESSAGES[error] }, { status });
}

/**
 * Receives steps, active energy and workouts from the Apple Health Shortcut. There is no login
 * here: the personal key in the Authorization header is the credential, and the database checks it
 * (and that the person is still allowed) before writing anything.
 */
export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return respond("missing_token", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond("invalid_body", 400);
  }

  const parsed = parseSyncPayload(body);
  if (!parsed.ok) return respond(parsed.error, 400);
  const { date, steps, activeKcal, workouts, skippedWorkouts } = parsed.value;

  const { url, anonKey } = getSupabaseEnv();
  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/ingest_health_sync`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token: token, p_date: date, p_steps: steps, p_active_kcal: activeKcal, p_workouts: workouts }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return respond("unavailable", 502);
  }
  if (!response.ok) return respond("unavailable", 502);

  const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; workouts?: number } | null;
  if (!result?.ok) {
    const error = result?.error;
    if (error === "invalid_token") return respond("invalid_token", 401);
    if (error === "not_allowed") return respond("not_allowed", 403);
    if (error === "invalid_date" || error === "invalid_value") return respond(error, 400);
    return respond("unavailable", 502);
  }

  return NextResponse.json({ ok: true, date, steps, activeKcal, workoutsSaved: result.workouts ?? 0, workoutsSkipped: skippedWorkouts });
}
