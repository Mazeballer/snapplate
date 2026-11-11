import type { Meal } from "./types";

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
