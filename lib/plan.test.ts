import { describe, expect, it } from "vitest";
import {
  buildPlan,
  changeGoal,
  defaultGoalWeightKg,
  goalWeightRange,
  planInputFromProfile,
  profileFromPlanInput,
  updateProfile,
  withCalculatedTargets,
  type PlanInput,
} from "./plan";

const TODAY = "2026-11-11";

const input: PlanInput = {
  sex: "male",
  dateOfBirth: "1996-05-14", // 30 on the test date
  heightCm: 175,
  weightKg: 78,
  activityLevel: "moderate",
  goal: "lose",
  goalWeightKg: 72,
  paceKgPerWeek: 0.5,
  dietPlan: "balanced",
};

describe("buildPlan", () => {
  it("matches a hand calculation", () => {
    // BMR = 780 + 1093.75 - 150 + 5 = 1728.75; x1.55 = 2680 maintenance; minus 550 for 0.5 kg/week
    const plan = buildPlan(input, TODAY);
    expect(plan.age).toBe(30);
    expect(plan.maintenance).toBe(2680);
    expect(plan.calories).toBe(2130);
    expect(plan.dailyDelta).toBe(-550);
    expect(plan.floored).toBe(false);
    expect(plan.macros.proteinG).toBe(Math.round((2130 * 0.3) / 4));
    expect(plan.bmiCategory).toBe("overweight");
  });

  it("projects the goal date: 6 kg at 0.5 kg a week is 12 weeks", () => {
    const plan = buildPlan(input, TODAY);
    expect(plan.projection?.weeks).toBe(12);
    expect(plan.projection?.date).toBe("2027-02-03");
  });

  it("has no projection and maintenance calories for a maintain goal", () => {
    const plan = buildPlan({ ...input, goal: "maintain", goalWeightKg: 78, paceKgPerWeek: 0 }, TODAY);
    expect(plan.projection).toBeNull();
    expect(plan.calories).toBe(plan.maintenance);
  });

  it("flags when the safety floor limited the calories", () => {
    const plan = buildPlan({ ...input, weightKg: 50, heightCm: 150, sex: "female", paceKgPerWeek: 1.5, goalWeightKg: 45 }, TODAY);
    expect(plan.floored).toBe(true);
    expect(plan.calories).toBe(1200);
  });
});

describe("goal weight", () => {
  it("offers a range that stays healthy for losing", () => {
    // BMI 18.5 at 175 cm is 56.66 kg, rounded up to 57.
    expect(goalWeightRange("lose", 78, 175)).toEqual({ min: 57, max: 77 });
  });

  it("offers heavier weights for gaining", () => {
    expect(goalWeightRange("gain", 78, 175)).toEqual({ min: 79, max: 118 });
  });

  it("is just today's weight for maintaining", () => {
    expect(goalWeightRange("maintain", 78.4, 175)).toEqual({ min: 78.4, max: 78.4 });
  });

  it("starts about 5 kg lighter or 4 kg heavier, kept inside the range", () => {
    expect(defaultGoalWeightKg("lose", 78, 175)).toBe(73);
    expect(defaultGoalWeightKg("gain", 78, 175)).toBe(82);
    expect(defaultGoalWeightKg("maintain", 78, 175)).toBe(78);
    // Already near the lowest healthy weight: it cannot suggest going much lower.
    expect(defaultGoalWeightKg("lose", 58, 175)).toBe(57);
  });
});

describe("saved profiles", () => {
  const profile = profileFromPlanInput(
    input,
    { units: "metric", restrictions: ["nuts"], dietaryPreference: null, addBurnedCalories: false, rolloverCalories: false },
    TODAY,
  );

  it("builds a complete profile with calculated targets", () => {
    expect(profile.onboarded).toBe(true);
    expect(profile.calorieTarget).toBe(2130);
    expect(profile.restrictions).toEqual(["nuts"]);
    expect(profile.calorieOverride).toBe(false);
    expect(planInputFromProfile(profile)).toEqual(input);
  });

  it("recalculates targets when body details change", () => {
    const heavier = updateProfile(profile, { weightKg: 88 }, TODAY);
    expect(heavier.calorieTarget).toBeGreaterThan(profile.calorieTarget);
    expect(heavier.calorieOverride).toBe(false);
  });

  it("recalculates macros when the diet plan changes", () => {
    const keto = updateProfile(profile, { dietPlan: "keto" }, TODAY);
    expect(keto.carbsG).toBeLessThan(profile.carbsG);
    expect(keto.fatG).toBeGreaterThan(profile.fatG);
    expect(keto.calorieTarget).toBe(profile.calorieTarget);
  });

  it("keeps typed targets and marks them as overridden", () => {
    const typed = updateProfile(profile, { calorieTarget: 1900 }, TODAY);
    expect(typed.calorieTarget).toBe(1900);
    expect(typed.calorieOverride).toBe(true);
    // A later weight change must not wipe the number the person typed.
    const later = updateProfile(typed, { weightKg: 90 }, TODAY);
    expect(later.calorieTarget).toBe(1900);
    expect(later.calorieOverride).toBe(true);
  });

  it("auto-generate clears the override", () => {
    const typed = updateProfile(profile, { calorieTarget: 1900 }, TODAY);
    const reset = withCalculatedTargets(typed, TODAY);
    expect(reset.calorieTarget).toBe(2130);
    expect(reset.calorieOverride).toBe(false);
  });

  it("does not recalculate for changes that do not affect targets", () => {
    const stepped = updateProfile(profile, { stepGoal: 12000, displayName: "Alex" }, TODAY);
    expect(stepped.calorieTarget).toBe(profile.calorieTarget);
    expect(stepped.stepGoal).toBe(12000);
  });

  it("changing the goal resets goal weight and pace sensibly", () => {
    const maintain = changeGoal(profile, "maintain", TODAY);
    expect(maintain.goal).toBe("maintain");
    expect(maintain.goalWeightKg).toBe(78);
    expect(maintain.paceKgPerWeek).toBe(0);
    expect(maintain.calorieTarget).toBe(2680);

    const gain = changeGoal(profile, "gain", TODAY);
    expect(gain.goalWeightKg).toBe(82);
    expect(gain.paceKgPerWeek).toBe(0.8);
    expect(gain.calorieTarget).toBeGreaterThan(2680);
  });

  it("returns the profile untouched while details are missing", () => {
    const partial = { ...profile, heightCm: null };
    expect(planInputFromProfile(partial)).toBeNull();
    expect(withCalculatedTargets(partial, TODAY)).toBe(partial);
  });
});
