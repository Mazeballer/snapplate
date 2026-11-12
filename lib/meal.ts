/** Pure helpers for logging a meal: picking a meal type, timing it, and scaling servings. */
import { minutesSinceMidnight, startOfLogDate, todayLogDate, type LogDate } from "./time";
import type { Meal, MealDraft, MealInput, MealType, NewMealItem, SavedMeal, SavedMealInput } from "./types";

/** Breakfast until 10:30, lunch until 15:00, a snack until 17:30, dinner until 22:00, then a snack. */
export function defaultMealType(minutes: number): MealType {
  if (minutes >= 5 * 60 && minutes < 10 * 60 + 30) return "breakfast";
  if (minutes >= 10 * 60 + 30 && minutes < 15 * 60) return "lunch";
  if (minutes >= 15 * 60 && minutes < 17 * 60 + 30) return "snack";
  if (minutes >= 17 * 60 + 30 && minutes < 22 * 60) return "dinner";
  return "snack";
}

/**
 * When to stamp a new entry. Logging for today uses the current moment. Logging for another day
 * keeps today's time of day, so the entry sorts sensibly within that day.
 */
export function loggedAtFor(logDate: LogDate, now: Date = new Date()): string {
  if (logDate === todayLogDate(now)) return now.toISOString();
  return new Date(startOfLogDate(logDate).getTime() + minutesSinceMidnight(now) * 60_000).toISOString();
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const scaleOpt = (n: number | null, f: number) => (n === null ? null : round1(n * f));

function scaleItem(item: NewMealItem, f: number): NewMealItem {
  return {
    ...item,
    quantity: round1(item.quantity * f),
    calories: Math.round(item.calories * f),
    proteinG: round1(item.proteinG * f),
    carbsG: round1(item.carbsG * f),
    fatG: round1(item.fatG * f),
  };
}

/** Turn a reviewed draft into the entry to save, with servings multiplied through. */
export function finalizeMeal(draft: MealDraft, loggedAt: string): MealInput {
  const f = draft.servings;
  return {
    loggedAt,
    mealType: draft.mealType,
    name: draft.name.trim(),
    emoji: draft.emoji,
    imagePath: draft.imagePath,
    calories: Math.round(draft.calories * f),
    proteinG: round1(draft.proteinG * f),
    carbsG: round1(draft.carbsG * f),
    fatG: round1(draft.fatG * f),
    fiberG: scaleOpt(draft.fiberG, f),
    sugarG: scaleOpt(draft.sugarG, f),
    sodiumMg: draft.sodiumMg === null ? null : Math.round(draft.sodiumMg * f),
    servings: f,
    healthScore: draft.healthScore,
    factors: draft.factors,
    source: draft.source,
    aiTraceId: draft.aiTraceId,
    items: draft.items.map((i) => scaleItem(i, f)),
  };
}

/** The draft's nutrition for the servings chosen, for showing totals while reviewing. */
export function draftTotals(draft: MealDraft) {
  const f = draft.servings;
  return {
    calories: Math.round(draft.calories * f),
    proteinG: round1(draft.proteinG * f),
    carbsG: round1(draft.carbsG * f),
    fatG: round1(draft.fatG * f),
  };
}

export function draftFromSaved(saved: SavedMeal, mealType: MealType): MealDraft {
  return {
    name: saved.name,
    emoji: saved.emoji,
    mealType,
    imagePath: null,
    imagePreview: null,
    source: "saved",
    aiTraceId: null,
    confidence: null,
    calories: saved.calories,
    proteinG: saved.proteinG,
    carbsG: saved.carbsG,
    fatG: saved.fatG,
    fiberG: saved.fiberG,
    sugarG: saved.sugarG,
    sodiumMg: saved.sodiumMg,
    servings: 1,
    healthScore: saved.healthScore,
    factors: saved.factors,
    items: saved.items,
  };
}

/** A draft saved as a favourite (one serving's worth). */
export function savedFromDraft(draft: MealDraft): SavedMealInput {
  return {
    name: draft.name.trim(),
    emoji: draft.emoji,
    calories: draft.calories,
    proteinG: draft.proteinG,
    carbsG: draft.carbsG,
    fatG: draft.fatG,
    fiberG: draft.fiberG,
    sugarG: draft.sugarG,
    sodiumMg: draft.sodiumMg,
    healthScore: draft.healthScore,
    factors: draft.factors,
    items: draft.items,
  };
}

/** A blank draft for typing a meal in by hand. */
export function emptyDraft(mealType: MealType): MealDraft {
  return {
    name: "",
    emoji: null,
    mealType,
    imagePath: null,
    imagePreview: null,
    source: "manual",
    aiTraceId: null,
    confidence: null,
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
    items: [],
  };
}

export const SERVING_STEP = 0.5;
export const MIN_SERVINGS = 0.5;
export const MAX_SERVINGS = 20;

export function stepServings(servings: number, direction: 1 | -1): number {
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round((servings + direction * SERVING_STEP) * 10) / 10));
}

/** A logged meal saved as a favourite: per-serving nutrition, so it can be logged again at any portion. */
export function savedFromMeal(meal: Meal): SavedMealInput {
  const f = meal.servings > 0 ? meal.servings : 1;
  const per = (n: number) => round1(n / f);
  const perOpt = (n: number | null) => (n === null ? null : round1(n / f));
  return {
    name: meal.name,
    emoji: meal.emoji,
    calories: Math.round(meal.calories / f),
    proteinG: per(meal.proteinG),
    carbsG: per(meal.carbsG),
    fatG: per(meal.fatG),
    fiberG: perOpt(meal.fiberG),
    sugarG: perOpt(meal.sugarG),
    sodiumMg: meal.sodiumMg === null ? null : Math.round(meal.sodiumMg / f),
    healthScore: meal.healthScore,
    factors: meal.factors,
    items: meal.items.map((item) => ({
      name: item.name,
      quantity: round1(item.quantity / f),
      unit: item.unit,
      calories: Math.round(item.calories / f),
      proteinG: per(item.proteinG),
      carbsG: per(item.carbsG),
      fatG: per(item.fatG),
    })),
  };
}
