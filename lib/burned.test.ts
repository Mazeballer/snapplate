import { describe, expect, it } from "vitest";
import { burnedCalories } from "./totals";

const health = (calories: number) => ({ calories, source: "shortcut" as const });
const byHand = (calories: number) => ({ calories, source: "manual" as const });
const byAi = (calories: number) => ({ calories, source: "text" as const });

describe("burnedCalories", () => {
  it("is just Health's active energy when nothing else is logged", () => {
    expect(burnedCalories(500, [])).toBe(500);
  });

  it("does not count Health's own workouts twice", () => {
    // A 300 kcal run is already inside the 500 kcal day total.
    expect(burnedCalories(500, [health(300)])).toBe(500);
  });

  it("adds workouts logged by hand or by AI on top of Health", () => {
    expect(burnedCalories(500, [byHand(200), byAi(100)])).toBe(800);
  });

  it("mixes both: Health's workout is inside the total, the manual one is extra", () => {
    expect(burnedCalories(500, [health(300), byHand(200)])).toBe(700);
  });

  it("trusts Health's workouts when the day total is missing or too low", () => {
    expect(burnedCalories(0, [health(300)])).toBe(300);
    expect(burnedCalories(120, [health(300), health(150)])).toBe(450);
  });

  it("is zero with nothing at all", () => {
    expect(burnedCalories(0, [])).toBe(0);
  });
});
