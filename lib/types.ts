import type { ActivityLevel, DietPlan, Goal, Sex } from "./nutrition";
import type { LogDate } from "./time";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSource = "photo" | "text" | "manual" | "saved";
export type Units = "metric" | "imperial";

export interface MealItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type FactorQuality = "good" | "fair" | "bad";

/** One reason behind a meal's health score, e.g. "High in added sugar". */
export interface HealthFactor {
  label: string;
  quality: FactorQuality;
  note: string;
}

export interface Meal {
  id: string;
  /** ISO timestamp. */
  loggedAt: string;
  /** Malaysia calendar date of loggedAt. */
  logDate: LogDate;
  mealType: MealType | null;
  name: string;
  /** Stand-in picture for meals without a photo. */
  emoji: string | null;
  imageUrl: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  servings: number;
  healthScore: number | null;
  factors: HealthFactor[];
  source: MealSource;
  items: MealItem[];
}

export interface Profile {
  displayName: string | null;
  sex: Sex | null;
  dateOfBirth: LogDate | null;
  heightCm: number | null;
  weightKg: number | null;
  units: Units;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
  goalWeightKg: number | null;
  paceKgPerWeek: number | null;
  dietPlan: DietPlan;
  /** A way of eating such as "vegan" or "pescatarian", or null for no particular diet. */
  dietaryPreference: string | null;
  restrictions: string[];
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  /** True when the user typed their own calorie target instead of the calculated one. */
  calorieOverride: boolean;
  stepGoal: number;
  addBurnedCalories: boolean;
  rolloverCalories: boolean;
  onboarded: boolean;
}

export interface WeightLog {
  logDate: LogDate;
  weightKg: number;
}

export interface DailyActivity {
  logDate: LogDate;
  steps: number;
  activeKcal: number;
}

// --- logging --------------------------------------------------------------------------------------

export interface NewMealItem {
  name: string;
  quantity: number;
  unit: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export type Confidence = "high" | "medium" | "low";

/**
 * A meal being reviewed before it is saved. Nutrition is for ONE serving; `servings` scales it
 * when saved, so the person can change the portion without losing the original estimate.
 */
export interface MealDraft {
  name: string;
  emoji: string | null;
  mealType: MealType | null;
  /** Storage path of the uploaded photo, once there is one. */
  imagePath: string | null;
  /** A local picture to show while reviewing (a blob URL). Never saved. */
  imagePreview: string | null;
  source: MealSource;
  aiTraceId: string | null;
  confidence: Confidence | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  servings: number;
  healthScore: number | null;
  factors: HealthFactor[];
  items: NewMealItem[];
}

/** A meal ready to insert: totals already include the servings. */
export interface MealInput {
  loggedAt: string;
  mealType: MealType | null;
  name: string;
  emoji: string | null;
  imagePath: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  servings: number;
  healthScore: number | null;
  factors: HealthFactor[];
  source: MealSource;
  aiTraceId: string | null;
  items: NewMealItem[];
}

/** A favourite meal that can be logged again. Nutrition is for one serving. */
export interface SavedMeal {
  id: string;
  name: string;
  emoji: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  healthScore: number | null;
  factors: HealthFactor[];
  items: NewMealItem[];
  createdAt: string;
}

export type SavedMealInput = Omit<SavedMeal, "id" | "createdAt">;

export type ExerciseIntensity = "low" | "medium" | "high";

export interface Exercise {
  id: string;
  loggedAt: string;
  logDate: LogDate;
  name: string;
  durationMin: number | null;
  intensity: ExerciseIntensity | null;
  calories: number;
  source: "manual" | "text" | "shortcut";
}

export interface ExerciseInput {
  loggedAt: string;
  name: string;
  durationMin: number | null;
  intensity: ExerciseIntensity | null;
  calories: number;
  source: "manual" | "text";
}
