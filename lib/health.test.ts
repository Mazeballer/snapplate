import { describe, expect, it } from "vitest";
import { parseDurationMin, parseKcal, parseNumber, parseSyncPayload } from "./health";

// 15 Nov 2026, 10:00 in Malaysia.
const NOW = new Date("2026-11-15T02:00:00.000Z");

describe("parseNumber", () => {
  it("reads numbers however Shortcuts formats them", () => {
    expect(parseNumber(8423)).toBe(8423);
    expect(parseNumber("8,423")).toBe(8423);
    expect(parseNumber("8423.5 steps")).toBe(8423.5);
    expect(parseNumber("312 kcal")).toBe(312);
  });
  it("is null when there is no number", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("none")).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(Number.NaN)).toBeNull();
  });
});

describe("parseKcal", () => {
  it("converts kilojoules to kilocalories", () => {
    expect(parseKcal("2092 kJ")).toBeCloseTo(500, 0);
    expect(parseKcal("1000 kilojoules")).toBeCloseTo(239, 0);
  });
  it("leaves kilocalories alone", () => {
    expect(parseKcal("512 kcal")).toBe(512);
    expect(parseKcal("512 Cal")).toBe(512);
    expect(parseKcal(512)).toBe(512);
  });
});

describe("parseDurationMin", () => {
  it("reads the formats Shortcuts produces", () => {
    expect(parseDurationMin(45)).toBe(45);
    expect(parseDurationMin("45")).toBe(45);
    expect(parseDurationMin("45 min")).toBe(45);
    expect(parseDurationMin("1 hr 5 min")).toBe(65);
    expect(parseDurationMin("1h 5m")).toBe(65);
    expect(parseDurationMin("0:45:12")).toBeCloseTo(45.2, 1);
    expect(parseDurationMin("45:12")).toBeCloseTo(45.2, 1);
    expect(parseDurationMin("90 sec")).toBe(1.5);
  });
  it("is null for nothing useful", () => {
    expect(parseDurationMin("")).toBeNull();
    expect(parseDurationMin("soon")).toBeNull();
    expect(parseDurationMin(0)).toBeNull();
  });
});

describe("parseSyncPayload", () => {
  it("accepts a normal sync and dates it to today in Malaysia", () => {
    const result = parseSyncPayload({ steps: "8,423", activeKcal: "512 kcal" }, NOW);
    expect(result).toEqual({
      ok: true,
      value: { date: "2026-11-15", steps: 8423, activeKcal: 512, workouts: [], skippedWorkouts: 0 },
    });
  });

  it("uses Malaysia's date even when it is still yesterday in UTC", () => {
    // 00:30 on 16 Nov in Malaysia is 16:30 on 15 Nov UTC.
    const result = parseSyncPayload({ steps: 100 }, new Date("2026-11-15T16:30:00.000Z"));
    expect(result.ok && result.value.date).toBe("2026-11-16");
  });

  it("keeps earlier values when a field is left out", () => {
    const result = parseSyncPayload({ steps: 5000 }, NOW);
    expect(result.ok && result.value.activeKcal).toBeNull();
  });

  it("reads workouts, tolerating different key names and formats", () => {
    const result = parseSyncPayload(
      {
        workouts: [
          { name: "Running", start: "2026-11-15T07:10:00+08:00", duration: "32 min", kcal: "310 kcal" },
          { type: "Traditional Strength Training", startedAt: "2026-11-14T18:00:00+08:00", durationMin: 50, calories: 220 },
        ],
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.workouts).toHaveLength(2);
    expect(result.value.workouts[0]).toMatchObject({ name: "Running", durationMin: 32, calories: 310 });
    expect(result.value.workouts[1]).toMatchObject({ name: "Traditional Strength Training", durationMin: 50, calories: 220 });
  });

  it("gives the same workout the same id, and ignores duplicates in one sync", () => {
    const w = { name: "Running", start: "2026-11-15T07:10:00+08:00", duration: 30, kcal: 300 };
    const a = parseSyncPayload({ workouts: [w, w] }, NOW);
    const b = parseSyncPayload({ workouts: [{ ...w, kcal: 305 }] }, NOW);
    if (!a.ok || !b.ok) throw new Error("expected both to parse");
    expect(a.value.workouts).toHaveLength(1);
    expect(a.value.workouts[0]!.externalId).toBe(b.value.workouts[0]!.externalId);
  });

  it("skips workouts it cannot read or that are too old, and says how many", () => {
    const result = parseSyncPayload(
      {
        steps: 10,
        workouts: [
          { name: "Run", start: "not a date", kcal: 100 },
          { name: "Old", start: "2026-10-01T07:00:00+08:00", kcal: 100 },
          "garbage",
          { name: "Good", start: "2026-11-15T07:00:00+08:00", kcal: 100 },
        ],
      },
      NOW,
    );
    expect(result.ok && result.value.workouts.map((w) => w.name)).toEqual(["Good"]);
    expect(result.ok && result.value.skippedWorkouts).toBe(3);
  });

  it("allows filling in a recent day, but not a future or old one", () => {
    expect(parseSyncPayload({ date: "2026-11-13", steps: 1 }, NOW).ok).toBe(true);
    expect(parseSyncPayload({ date: "2026-11-16", steps: 1 }, NOW)).toEqual({ ok: false, error: "invalid_date" });
    expect(parseSyncPayload({ date: "2026-11-01", steps: 1 }, NOW)).toEqual({ ok: false, error: "invalid_date" });
    expect(parseSyncPayload({ date: "tomorrow", steps: 1 }, NOW)).toEqual({ ok: false, error: "invalid_date" });
  });

  it("rejects values that make no sense instead of storing them", () => {
    expect(parseSyncPayload({ steps: "lots" }, NOW)).toEqual({ ok: false, error: "invalid_steps" });
    expect(parseSyncPayload({ steps: -5 }, NOW)).toEqual({ ok: false, error: "invalid_steps" });
    expect(parseSyncPayload({ steps: 9_999_999 }, NOW)).toEqual({ ok: false, error: "invalid_steps" });
    expect(parseSyncPayload({ activeKcal: 99_999 }, NOW)).toEqual({ ok: false, error: "invalid_active_kcal" });
  });

  it("needs something to sync, and a JSON object", () => {
    expect(parseSyncPayload({}, NOW)).toEqual({ ok: false, error: "nothing_to_sync" });
    expect(parseSyncPayload({ workouts: [] }, NOW)).toEqual({ ok: false, error: "nothing_to_sync" });
    expect(parseSyncPayload("steps=5", NOW)).toEqual({ ok: false, error: "invalid_body" });
    expect(parseSyncPayload([], NOW)).toEqual({ ok: false, error: "invalid_body" });
    expect(parseSyncPayload(null, NOW)).toEqual({ ok: false, error: "invalid_body" });
  });
});
