import type { Exercise, Meal } from "./types";

export interface Totals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  count: number;
}

export const EMPTY_TOTALS: Totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, count: 0 };

/** Add up calories and macros for a list of meals. */
export function sumMeals(meals: readonly Meal[]): Totals {
  const totals = { ...EMPTY_TOTALS };
  for (const m of meals) {
    totals.calories += m.calories;
    totals.proteinG += m.proteinG;
    totals.carbsG += m.carbsG;
    totals.fatG += m.fatG;
    totals.count += 1;
  }
  return totals;
}

/** Group meals by their Malaysia log date. */
export function groupByDate(meals: readonly Meal[]): Map<string, Meal[]> {
  const map = new Map<string, Meal[]>();
  for (const m of meals) {
    const list = map.get(m.logDate);
    if (list) list.push(m);
    else map.set(m.logDate, [m]);
  }
  return map;
}

/** Average health score of the meals that have one, or null when none do. */
export function averageHealthScore(meals: readonly Meal[]): number | null {
  const scores = meals.map((m) => m.healthScore).filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** The most unused calories that carry over into the next day. */
export const ROLLOVER_CAP_KCAL = 200;

/**
 * Unused calories from the previous day that are added to today's goal, up to the cap.
 * Nothing carries over from a day with no meals logged (that is a missed day, not a saved one),
 * and eating over the goal never takes calories away.
 */
export function rolloverAmount(previousGoal: number, previousEaten: number, hadLogs: boolean): number {
  if (!hadLogs) return 0;
  return Math.min(ROLLOVER_CAP_KCAL, Math.max(0, Math.round(previousGoal - previousEaten)));
}

/**
 * Calories burned in a day, without counting anything twice.
 *
 * Apple Health's Active Energy already includes the workouts it recorded, so workouts that came
 * from Health (source "shortcut") are not added on top of it. If Health's day total is missing or
 * lower than its own workouts (a half-finished sync), the workouts' total is used instead.
 * Workouts logged by hand or by AI are not in Health, so they are added on top.
 */
export function burnedCalories(
  activeKcal: number,
  exercises: readonly Pick<Exercise, "calories" | "source">[],
): number {
  let fromHealth = 0;
  let byHand = 0;
  for (const e of exercises) {
    if (e.source === "shortcut") fromHealth += e.calories;
    else byHand += e.calories;
  }
  return Math.max(activeKcal, fromHealth) + byHand;
}
