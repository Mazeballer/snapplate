/**
 * Turns a person's body details and goal into a daily plan, and keeps a saved profile's targets
 * in step when those details change. Pure functions, no I/O.
 */
import {
  bmi,
  bmiCategory,
  calorieTarget,
  clampPace,
  DEFAULT_PACE_KG_PER_WEEK,
  macroTargets,
  projectGoalDate,
  round1,
  type ActivityLevel,
  type BmiCategory,
  type DietPlan,
  type GoalProjection,
  type Goal,
  type MacroTargets,
  type Sex,
} from "./nutrition";
import { ageOn, type LogDate } from "./time";
import type { Profile, Units } from "./types";

/** Everything needed to calculate a plan. */
export interface PlanInput {
  sex: Sex;
  dateOfBirth: LogDate;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  goalWeightKg: number;
  paceKgPerWeek: number;
  dietPlan: DietPlan;
}

export interface Plan {
  age: number;
  calories: number;
  maintenance: number;
  /** True when the safety floor stopped the calories from going lower. */
  floored: boolean;
  dailyDelta: number;
  macros: MacroTargets;
  projection: GoalProjection | null;
  bmi: number;
  bmiCategory: BmiCategory;
}

export function buildPlan(input: PlanInput, today: LogDate): Plan {
  const age = ageOn(input.dateOfBirth, today);
  const target = calorieTarget(
    { sex: input.sex, weightKg: input.weightKg, heightCm: input.heightCm, age },
    input.activityLevel,
    input.goal,
    input.paceKgPerWeek,
  );
  const pace = input.goal === "maintain" ? 0 : clampPace(input.goal, input.paceKgPerWeek);
  const value = bmi(input.weightKg, input.heightCm);
  return {
    age,
    calories: target.calories,
    maintenance: target.maintenance,
    floored: target.floored,
    dailyDelta: target.dailyDelta,
    macros: macroTargets(target.calories, input.dietPlan),
    projection: projectGoalDate(input.goal, input.weightKg, input.goalWeightKg, pace, today),
    bmi: value,
    bmiCategory: bmiCategory(value),
  };
}

// --- goal weight ----------------------------------------------------------------------------

/** The heaviest weight that is still a healthy BMI (24.9) for this height. */
const kgAtBmi = (heightCm: number, bmiValue: number) => bmiValue * (heightCm / 100) ** 2;

/** The range of goal weights offered for a goal. For "maintain" it is just today's weight. */
export function goalWeightRange(goal: Goal, weightKg: number, heightCm: number): { min: number; max: number } {
  if (goal === "maintain") return { min: round1(weightKg), max: round1(weightKg) };
  if (goal === "lose") {
    const floor = Math.max(35, Math.ceil(kgAtBmi(heightCm, 18.5)));
    return { min: Math.min(floor, Math.floor(weightKg) - 1), max: Math.max(Math.floor(weightKg) - 1, 35) };
  }
  return { min: Math.ceil(weightKg) + 1, max: Math.min(250, Math.ceil(weightKg) + 40) };
}

/** A sensible starting goal weight: about 5 kg off or on, kept inside the allowed range. */
export function defaultGoalWeightKg(goal: Goal, weightKg: number, heightCm: number): number {
  if (goal === "maintain") return round1(weightKg);
  const { min, max } = goalWeightRange(goal, weightKg, heightCm);
  const wanted = goal === "lose" ? weightKg - 5 : weightKg + 4;
  return Math.round(Math.min(max, Math.max(min, wanted)));
}

export const defaultPaceFor = (goal: Goal): number => (goal === "maintain" ? 0 : DEFAULT_PACE_KG_PER_WEEK);

// --- keeping a saved profile in step -----------------------------------------------------------

/** The plan input for a profile, or null while some detail is still missing. */
export function planInputFromProfile(p: Profile): PlanInput | null {
  if (
    p.sex === null ||
    p.dateOfBirth === null ||
    p.heightCm === null ||
    p.weightKg === null ||
    p.activityLevel === null ||
    p.goal === null
  ) {
    return null;
  }
  return {
    sex: p.sex,
    dateOfBirth: p.dateOfBirth,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    activityLevel: p.activityLevel,
    goal: p.goal,
    goalWeightKg: p.goalWeightKg ?? p.weightKg,
    paceKgPerWeek: p.paceKgPerWeek ?? defaultPaceFor(p.goal),
    dietPlan: p.dietPlan,
  };
}

/** Replace the calorie and nutrient targets with freshly calculated ones. */
export function withCalculatedTargets(profile: Profile, today: LogDate): Profile {
  const input = planInputFromProfile(profile);
  if (!input) return profile;
  const plan = buildPlan(input, today);
  return {
    ...profile,
    calorieTarget: plan.calories,
    proteinG: plan.macros.proteinG,
    carbsG: plan.macros.carbsG,
    fatG: plan.macros.fatG,
    fiberG: plan.macros.fiberG,
    sugarG: plan.macros.sugarG,
    sodiumMg: plan.macros.sodiumMg,
    calorieOverride: false,
  };
}

/**
 * Apply edits to a profile. Targets are recalculated whenever something that affects them
 * changed, unless the person typed their own targets (calorieOverride), which are left alone.
 */
export function updateProfile(profile: Profile, changes: Partial<Profile>, today: LogDate): Profile {
  const merged: Profile = { ...profile, ...changes };

  const typedTargets =
    "calorieTarget" in changes ||
    "proteinG" in changes ||
    "carbsG" in changes ||
    "fatG" in changes;
  if (typedTargets) return { ...merged, calorieOverride: changes.calorieOverride ?? true };

  const affectsTargets = (
    ["sex", "dateOfBirth", "heightCm", "weightKg", "activityLevel", "goal", "goalWeightKg", "paceKgPerWeek", "dietPlan"] as const
  ).some((key) => key in changes);

  if (affectsTargets && !merged.calorieOverride) return withCalculatedTargets(merged, today);
  return merged;
}

/** Goal-weight and pace make no sense once the goal changes direction; reset them. */
export function changeGoal(profile: Profile, goal: Goal, today: LogDate): Profile {
  const weight = profile.weightKg;
  const height = profile.heightCm;
  return updateProfile(
    profile,
    {
      goal,
      goalWeightKg: weight !== null && height !== null ? defaultGoalWeightKg(goal, weight, height) : profile.goalWeightKg,
      paceKgPerWeek: defaultPaceFor(goal),
    },
    today,
  );
}

/** A brand-new profile from onboarding answers. */
export interface ProfileExtras {
  units: Units;
  restrictions: string[];
  dietaryPreference: string | null;
  addBurnedCalories: boolean;
  rolloverCalories: boolean;
}

export function profileFromPlanInput(input: PlanInput, extras: ProfileExtras, today: LogDate): Profile {
  const base: Profile = {
    displayName: null,
    sex: input.sex,
    dateOfBirth: input.dateOfBirth,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    units: extras.units,
    activityLevel: input.activityLevel,
    goal: input.goal,
    goalWeightKg: input.goalWeightKg,
    paceKgPerWeek: input.paceKgPerWeek,
    dietPlan: input.dietPlan,
    dietaryPreference: extras.dietaryPreference,
    restrictions: extras.restrictions,
    calorieTarget: 2000,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 2300,
    calorieOverride: false,
    stepGoal: 10000,
    addBurnedCalories: extras.addBurnedCalories,
    rolloverCalories: extras.rolloverCalories,
    onboarded: true,
  };
  return withCalculatedTargets(base, today);
}
