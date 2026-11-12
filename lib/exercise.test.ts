import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHT_KG, estimateWorkoutCalories } from "./exercise";

describe("estimateWorkoutCalories", () => {
  it("matches a hand calculation: 9.8 MET x 70 kg x 0.5 h", () => {
    expect(estimateWorkoutCalories("run", "medium", 30, 70)).toBe(343);
  });

  it("burns more at higher intensity and for longer", () => {
    const low = estimateWorkoutCalories("run", "low", 30, 70);
    const high = estimateWorkoutCalories("run", "high", 30, 70);
    expect(high).toBeGreaterThan(low);
    expect(estimateWorkoutCalories("run", "medium", 60, 70)).toBe(686);
  });

  it("scales with body weight", () => {
    expect(estimateWorkoutCalories("weights", "medium", 60, 90)).toBe(450);
    expect(estimateWorkoutCalories("weights", "medium", 60, 60)).toBe(300);
  });

  it("assumes a typical weight when none is known", () => {
    expect(estimateWorkoutCalories("weights", "low", 60, null)).toBe(Math.round(3.5 * DEFAULT_WEIGHT_KG));
  });

  it("is zero for no time", () => {
    expect(estimateWorkoutCalories("run", "high", 0, 70)).toBe(0);
    expect(estimateWorkoutCalories("run", "high", Number.NaN, 70)).toBe(0);
  });
});
