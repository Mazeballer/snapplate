import { describe, expect, it } from "vitest";
import { clampScore, formatScore, healthBand, scoreMeal } from "./healthScore";
import { ringProgress, ringState } from "./rings";
import { currentStreak, longestStreak } from "./streak";
import { averageHealthScore, groupByDate, rolloverAmount, sumMeals } from "./totals";
import type { Meal } from "./types";

function meal(partial: Partial<Meal>): Meal {
  return {
    id: "m",
    loggedAt: "2026-11-03T04:00:00.000Z",
    logDate: "2026-11-03",
    mealType: "lunch",
    name: "Test",
    emoji: null,
    imageUrl: null,
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    servings: 1,
    healthScore: null,
    factors: [],
    source: "manual",
    items: [],
    ...partial,
  };
}

describe("ringState", () => {
  it("is empty when nothing was logged", () => {
    expect(ringState(0, 2000, false)).toBe("empty");
  });

  it("is on target within 100 kcal either side", () => {
    expect(ringState(2000, 2000, true)).toBe("on");
    expect(ringState(2100, 2000, true)).toBe("on");
    expect(ringState(1900, 2000, true)).toBe("on");
  });

  it("is yellow 101 to 199 over, red from 200 over", () => {
    expect(ringState(2101, 2000, true)).toBe("slightly_over");
    expect(ringState(2199, 2000, true)).toBe("slightly_over");
    expect(ringState(2200, 2000, true)).toBe("over");
    expect(ringState(3000, 2000, true)).toBe("over");
  });

  it("is under when more than 100 kcal below goal", () => {
    expect(ringState(1899, 2000, true)).toBe("under");
    expect(ringState(400, 2000, true)).toBe("under");
  });
});

describe("ringProgress", () => {
  it("clamps between 0 and 1", () => {
    expect(ringProgress(1000, 2000)).toBe(0.5);
    expect(ringProgress(3000, 2000)).toBe(1);
    expect(ringProgress(-5, 2000)).toBe(0);
    expect(ringProgress(100, 0)).toBe(0);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-11-01", "2026-11-02", "2026-11-03"], "2026-11-03")).toBe(3);
  });

  it("does not break while today is still empty", () => {
    expect(currentStreak(["2026-11-01", "2026-11-02"], "2026-11-03")).toBe(2);
  });

  it("breaks after a missed whole day", () => {
    expect(currentStreak(["2026-11-01", "2026-11-02"], "2026-11-04")).toBe(0);
    expect(currentStreak(["2026-10-30", "2026-11-02", "2026-11-03"], "2026-11-03")).toBe(2);
  });

  it("crosses month and year ends and ignores duplicates", () => {
    expect(
      currentStreak(["2026-12-31", "2027-01-01", "2027-01-01", "2027-01-02"], "2027-01-02"),
    ).toBe(3);
  });

  it("is zero with no logs", () => {
    expect(currentStreak([], "2026-11-03")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("finds the longest run", () => {
    expect(longestStreak(["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05", "2026-11-06"])).toBe(3);
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(["2026-11-01"])).toBe(1);
  });
});

describe("totals", () => {
  const meals = [
    meal({ id: "a", calories: 500, proteinG: 30, carbsG: 50, fatG: 20, healthScore: 8 }),
    meal({ id: "b", calories: 700, proteinG: 20, carbsG: 90, fatG: 25, healthScore: 4 }),
    meal({ id: "c", calories: 100, logDate: "2026-11-04", healthScore: null }),
  ];

  it("sums calories and macros", () => {
    expect(sumMeals(meals)).toEqual({ calories: 1300, proteinG: 50, carbsG: 140, fatG: 45, count: 3 });
    expect(sumMeals([]).count).toBe(0);
  });

  it("groups by date", () => {
    const grouped = groupByDate(meals);
    expect(grouped.get("2026-11-03")).toHaveLength(2);
    expect(grouped.get("2026-11-04")).toHaveLength(1);
  });

  it("averages only scored meals", () => {
    expect(averageHealthScore(meals)).toBe(6);
    expect(averageHealthScore([meal({})])).toBeNull();
  });
});

describe("health score", () => {
  it("maps scores to bands", () => {
    expect(healthBand(10).label).toBe("Excellent");
    expect(healthBand(9).label).toBe("Excellent");
    expect(healthBand(8.9).label).toBe("Healthy");
    expect(healthBand(7).label).toBe("Healthy");
    expect(healthBand(5).label).toBe("Fair");
    expect(healthBand(3).label).toBe("Unhealthy");
    expect(healthBand(2.9).label).toBe("Very unhealthy");
    expect(healthBand(0).tone).toBe("bad");
  });

  it("formats and clamps", () => {
    expect(formatScore(8)).toBe("8");
    expect(formatScore(7.54)).toBe("7.5");
    expect(formatScore(12)).toBe("10");
    expect(clampScore(-3)).toBe(0);
  });
});

describe("rolloverAmount", () => {
  it("carries over unused calories up to 200", () => {
    expect(rolloverAmount(2000, 1900, true)).toBe(100);
    expect(rolloverAmount(2000, 1500, true)).toBe(200);
    expect(rolloverAmount(2000, 800, true)).toBe(200);
  });

  it("never goes negative when the goal was exceeded", () => {
    expect(rolloverAmount(2000, 2300, true)).toBe(0);
  });

  it("carries nothing over from a day with no meals logged", () => {
    expect(rolloverAmount(2000, 0, false)).toBe(0);
  });
});

describe("scoreMeal", () => {
  const salad = { calories: 520, proteinG: 51, carbsG: 32, fatG: 20, fiberG: 6, sugarG: 5, sodiumMg: 420, processing: "whole" as const };
  const tehTarik = { calories: 130, proteinG: 3, carbsG: 20, fatG: 4, fiberG: 0, sugarG: 19, sodiumMg: 60, processing: "mixed" as const };
  const nasiLemak = { calories: 618, proteinG: 20, carbsG: 66, fatG: 31, fiberG: 4, sugarG: 6, sodiumMg: 980, processing: "mixed" as const };

  it("scores a lean whole-food meal high", () => {
    expect(scoreMeal(salad).score).toBeGreaterThanOrEqual(9);
  });

  it("scores a sugary drink low", () => {
    const result = scoreMeal(tehTarik);
    expect(result.score).toBeLessThan(5);
    expect(result.factors.find((f) => f.label === "Sugar")?.quality).toBe("bad");
  });

  it("ranks the healthy meal above the heavy one above the sugary drink", () => {
    expect(scoreMeal(salad).score).toBeGreaterThan(scoreMeal(nasiLemak).score);
    expect(scoreMeal(nasiLemak).score).toBeGreaterThan(scoreMeal(tehTarik).score);
  });

  it("penalises heavily processed food", () => {
    expect(scoreMeal({ ...salad, processing: "ultra" }).score).toBeLessThan(scoreMeal(salad).score - 2);
  });

  it("stays between 0 and 10 and explains itself", () => {
    const worst = scoreMeal({ calories: 100, proteinG: 0, carbsG: 25, fatG: 6, fiberG: 0, sugarG: 30, sodiumMg: 900, processing: "ultra" });
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(10);
    expect(worst.factors.length).toBeGreaterThan(2);
    expect(scoreMeal(salad).score).toBeLessThanOrEqual(10);
  });

  it("skips factors for nutrients that are unknown", () => {
    const result = scoreMeal({ ...salad, fiberG: null, sugarG: null, sodiumMg: null });
    const labels = result.factors.map((f) => f.label);
    expect(labels).not.toContain("Sugar");
    expect(labels).not.toContain("Sodium");
    expect(labels).not.toContain("Fibre");
  });
});
