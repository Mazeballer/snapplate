/**
 * Goal and plan calculations. Pure functions, no I/O.
 *
 * Standard published formulas only: Mifflin-St Jeor for resting energy, a
 * conventional activity multiplier, and about 7700 kcal per kg of body weight
 * for turning a weekly pace into a daily deficit or surplus.
 */

import { addDays, type LogDate } from "./time";

export type Sex = "male" | "female" | "other";
export type ActivityLevel = "light" | "moderate" | "active";
export type Goal = "lose" | "maintain" | "gain";
export type DietPlan = "balanced" | "high_carb" | "high_protein" | "keto" | "low_carb";
export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";

export const KCAL_PER_KG = 7700;

/** Workouts per week: light = 0-2, moderate = 3-5, active = 6 or more. */
export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** Lowest daily calories we will ever set, whatever the goal asks for. */
export const MIN_CALORIES: Record<Sex, number> = {
  female: 1200,
  male: 1500,
  other: 1350,
};

/**
 * Weekly pace limits in kg, and the point above which we warn it is aggressive. These follow the
 * range the reference app offers: 0.1 to 1.5 kg a week, with anything over 1 kg flagged as fast.
 * The calorie safety floor still applies on top, whatever pace is chosen.
 */
export const PACE_LIMITS = {
  lose: { min: 0.1, max: 1.5, fastAbove: 1 },
  gain: { min: 0.1, max: 1.5, fastAbove: 1 },
} as const;

export const DEFAULT_PACE_KG_PER_WEEK = 0.8;

export type PaceLevel = "slow" | "balanced" | "fast";

/**
 * Which band a pace falls in, judged in the units the person picked it in: in metric up to
 * 0.4 kg a week is slow and up to 1.0 is balanced; in imperial up to 1 lb is slow and up to 2 lb
 * is balanced. Anything above is fast.
 */
export function paceLevel(paceKgPerWeek: number, units: "metric" | "imperial"): PaceLevel {
  if (units === "metric") {
    const tenths = Math.round(paceKgPerWeek * 10);
    return tenths <= 4 ? "slow" : tenths <= 10 ? "balanced" : "fast";
  }
  const tenthsOfPound = Math.round(paceKgPerWeek * 22.0462);
  return tenthsOfPound <= 10 ? "slow" : tenthsOfPound <= 20 ? "balanced" : "fast";
}

/** Share of calories from protein / carbs / fat for each diet plan. */
export const MACRO_SPLIT: Record<DietPlan, { protein: number; carbs: number; fat: number }> = {
  balanced: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  high_carb: { protein: 0.25, carbs: 0.55, fat: 0.2 },
  high_protein: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  keto: { protein: 0.25, carbs: 0.05, fat: 0.7 },
  low_carb: { protein: 0.3, carbs: 0.2, fat: 0.5 },
};

export interface BodyStats {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}

/** Resting energy expenditure (kcal/day), Mifflin-St Jeor. */
export function bmr({ sex, weightKg, heightCm, age }: BodyStats): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78; // midpoint of the male and female constants
}

/** Maintenance calories: resting energy times the activity multiplier. */
export function maintenanceCalories(stats: BodyStats, activity: ActivityLevel): number {
  return Math.round(bmr(stats) * ACTIVITY_MULTIPLIER[activity]);
}

export function clampPace(goal: Goal, paceKgPerWeek: number): number {
  if (goal === "maintain") return 0;
  const { min, max } = PACE_LIMITS[goal];
  return Math.min(max, Math.max(min, paceKgPerWeek));
}

/** True when the chosen pace deserves a warning (fast loss or fast gain). */
export function isFastPace(goal: Goal, paceKgPerWeek: number): boolean {
  if (goal === "maintain") return false;
  return paceKgPerWeek > PACE_LIMITS[goal].fastAbove;
}

export interface CalorieTarget {
  calories: number;
  maintenance: number;
  /** Signed daily change from maintenance that was actually applied. */
  dailyDelta: number;
  /** True when the safety floor stopped us cutting as deep as asked. */
  floored: boolean;
}

/** Daily calorie target for a goal and weekly pace, with a safety floor. */
export function calorieTarget(
  stats: BodyStats,
  activity: ActivityLevel,
  goal: Goal,
  paceKgPerWeek: number,
): CalorieTarget {
  const maintenance = maintenanceCalories(stats, activity);
  if (goal === "maintain") {
    return { calories: maintenance, maintenance, dailyDelta: 0, floored: false };
  }
  const pace = clampPace(goal, paceKgPerWeek);
  const wanted = Math.round((pace * KCAL_PER_KG) / 7);
  if (goal === "gain") {
    return { calories: maintenance + wanted, maintenance, dailyDelta: wanted, floored: false };
  }
  const floor = MIN_CALORIES[stats.sex];
  const raw = maintenance - wanted;
  const calories = Math.max(raw, floor);
  return { calories, maintenance, dailyDelta: calories - maintenance, floored: raw < floor };
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

/** Macro and micronutrient targets for a calorie goal and diet plan. */
export function macroTargets(calories: number, plan: DietPlan): MacroTargets {
  const split = MACRO_SPLIT[plan];
  return {
    proteinG: Math.round((calories * split.protein) / 4),
    carbsG: Math.round((calories * split.carbs) / 4),
    fatG: Math.round((calories * split.fat) / 9),
    fiberG: Math.round((calories / 1000) * 14), // 14 g per 1000 kcal
    sugarG: Math.round((calories * 0.1) / 4), // up to 10% of calories
    sodiumMg: 2300,
  };
}

export interface GoalProjection {
  weeks: number;
  /** Log date on which the goal weight is reached at the chosen pace. */
  date: LogDate;
}

/**
 * When the goal weight is reached at a steady pace. Returns null for
 * "maintain", a zero pace, or a goal weight on the wrong side of current weight.
 */
export function projectGoalDate(
  goal: Goal,
  currentKg: number,
  goalKg: number,
  paceKgPerWeek: number,
  from: LogDate,
): GoalProjection | null {
  if (goal === "maintain" || paceKgPerWeek <= 0) return null;
  const diff = goal === "lose" ? currentKg - goalKg : goalKg - currentKg;
  if (diff <= 0) return null;
  const weeks = diff / paceKgPerWeek;
  return { weeks, date: addDays(from, Math.ceil(weeks * 7)) };
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "underweight";
  if (value < 25) return "normal";
  if (value < 30) return "overweight";
  return "obese";
}

const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export const ftInToCm = (feet: number, inches: number): number =>
  (feet * 12 + inches) * CM_PER_INCH;

/** Round to one decimal place, for display and storage of weights. */
export const round1 = (value: number): number => Math.round(value * 10) / 10;
