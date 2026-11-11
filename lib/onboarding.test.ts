import { describe, expect, it } from "vitest";
import {
  canContinue,
  DEFAULT_DRAFT,
  draftToPlanInput,
  draftToProfile,
  previewDraft,
  stepsFor,
  withGoal,
  type Draft,
} from "./onboarding";
import { daysInMonth, makeLogDate } from "./time";

const TODAY = "2026-11-11";

describe("stepsFor", () => {
  it("asks about goal weight and pace when losing or gaining", () => {
    expect(stepsFor("lose")).toContain("goalWeight");
    expect(stepsFor("gain")).toContain("pace");
  });

  it("skips them when maintaining or before a goal is chosen", () => {
    for (const goal of ["maintain", null] as const) {
      const steps = stepsFor(goal);
      expect(steps).not.toContain("goalWeight");
      expect(steps).not.toContain("pace");
    }
  });

  it("starts with sex and ends with the plan", () => {
    const steps = stepsFor("lose");
    expect(steps[0]).toBe("sex");
    expect(steps[steps.length - 1]).toBe("plan");
    expect(steps.indexOf("building")).toBe(steps.length - 2);
  });

  it("has no marketing questions", () => {
    const all = stepsFor("lose") as string[];
    for (const dropped of ["heardPlatform", "otherApps", "personalTrainer", "promoCode", "rating"]) {
      expect(all).not.toContain(dropped);
    }
  });
});

describe("canContinue", () => {
  it("needs a sex, an activity level and a goal", () => {
    expect(canContinue("sex", DEFAULT_DRAFT, TODAY)).toBe(false);
    expect(canContinue("sex", { ...DEFAULT_DRAFT, sex: "female" }, TODAY)).toBe(true);
    expect(canContinue("activity", DEFAULT_DRAFT, TODAY)).toBe(false);
    expect(canContinue("goal", DEFAULT_DRAFT, TODAY)).toBe(false);
    expect(canContinue("burned", DEFAULT_DRAFT, TODAY)).toBe(false);
    expect(canContinue("rollover", { ...DEFAULT_DRAFT, rollover: false }, TODAY)).toBe(true);
  });

  it("lets pickers with sensible defaults through", () => {
    for (const step of ["height", "weight", "pace", "dietPlan", "dietary", "allergies"] as const) {
      expect(canContinue(step, DEFAULT_DRAFT, TODAY)).toBe(true);
    }
  });

  it("blocks a date of birth under the minimum age", () => {
    expect(canContinue("birthday", { ...DEFAULT_DRAFT, dateOfBirth: "2015-01-01" }, TODAY)).toBe(false);
    expect(canContinue("birthday", { ...DEFAULT_DRAFT, dateOfBirth: "2013-11-11" }, TODAY)).toBe(true);
    expect(canContinue("birthday", { ...DEFAULT_DRAFT, dateOfBirth: "2013-11-12" }, TODAY)).toBe(false);
  });
});

describe("withGoal", () => {
  it("fills a goal weight and the default pace", () => {
    const lose = withGoal(DEFAULT_DRAFT, "lose");
    expect(lose.goalWeightKg).toBe(65); // 70 kg minus 5
    expect(lose.paceKgPerWeek).toBe(0.8);
    expect(withGoal(DEFAULT_DRAFT, "gain").goalWeightKg).toBe(74);
  });

  it("uses today's weight for maintain", () => {
    expect(withGoal(DEFAULT_DRAFT, "maintain").goalWeightKg).toBe(70);
  });
});

describe("draftToPlanInput / draftToProfile", () => {
  const ready: Draft = {
    ...withGoal({ ...DEFAULT_DRAFT, sex: "male", activity: "moderate", heightCm: 175, weightKg: 78, dateOfBirth: "1996-05-14" }, "lose"),
    addBurned: true,
    rollover: false,
    restrictions: ["nuts"],
    dietary: "vegetarian",
  };

  it("is null until the required answers exist", () => {
    expect(draftToPlanInput(DEFAULT_DRAFT)).toBeNull();
    expect(draftToProfile(DEFAULT_DRAFT, TODAY)).toBeNull();
  });

  it("ignores goal weight and pace when maintaining", () => {
    const input = draftToPlanInput({ ...ready, goal: "maintain", goalWeightKg: 50, paceKgPerWeek: 1.2 });
    expect(input?.goalWeightKg).toBe(78);
    expect(input?.paceKgPerWeek).toBe(0);
  });

  it("turns the answers into a complete, calculated profile", () => {
    const profile = draftToProfile(ready, TODAY);
    expect(profile?.onboarded).toBe(true);
    expect(profile?.goal).toBe("lose");
    expect(profile?.goalWeightKg).toBe(73);
    expect(profile?.addBurnedCalories).toBe(true);
    expect(profile?.rolloverCalories).toBe(false);
    expect(profile?.restrictions).toEqual(["nuts"]);
    expect(profile?.dietaryPreference).toBe("vegetarian");
    expect(profile?.calorieTarget).toBeGreaterThan(1200);
    expect(profile?.proteinG).toBeGreaterThan(0);
  });

  it("the preview draft is complete", () => {
    expect(draftToProfile(previewDraft(), TODAY)).not.toBeNull();
  });
});

describe("birthday helpers", () => {
  it("knows month lengths including leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("clamps the day when the month changes", () => {
    expect(makeLogDate(2026, 2, 31)).toBe("2026-02-28");
    expect(makeLogDate(2028, 2, 31)).toBe("2028-02-29");
    expect(makeLogDate(1999, 7, 4)).toBe("1999-07-04");
  });
});
