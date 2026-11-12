/** Turns the AI's (validated) answer into a meal draft or workout, calculating totals and the score ourselves. */
import { scoreMeal } from "@/lib/healthScore";
import type { ExerciseInput, MealDraft, MealType, NewMealItem } from "@/lib/types";
import type { AnalysisItem, ExerciseAnalysis, MealAnalysis } from "./schema";

const round1 = (n: number) => Math.round(n * 10) / 10;

function toItem(i: AnalysisItem): NewMealItem {
  return {
    name: i.name,
    quantity: i.quantity,
    unit: i.unit || null,
    calories: Math.round(i.calories),
    proteinG: round1(i.protein_g),
    carbsG: round1(i.carbs_g),
    fatG: round1(i.fat_g),
  };
}

/** Sum a nutrient across items; unknown (null) only if no item reported it. */
function sumOptional(items: AnalysisItem[], key: "fiber_g" | "sugar_g" | "sodium_mg"): number | null {
  const known = items.map((i) => i[key]).filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
}

export type NormalizeResult<T> = { ok: true; value: T } | { ok: false; error: "not_food" | "not_exercise" | "invalid_response" };

export function mealAnalysisToDraft(
  analysis: MealAnalysis,
  options: { source: "photo" | "text"; traceId: string; mealType: MealType | null; imagePath?: string | null },
): NormalizeResult<MealDraft> {
  if (!analysis.is_food || analysis.items.length === 0) return { ok: false, error: "not_food" };

  const items = analysis.items.map(toItem);
  const calories = items.reduce((sum, i) => sum + i.calories, 0);
  if (calories <= 0) return { ok: false, error: "invalid_response" };

  const proteinG = round1(items.reduce((s, i) => s + i.proteinG, 0));
  const carbsG = round1(items.reduce((s, i) => s + i.carbsG, 0));
  const fatG = round1(items.reduce((s, i) => s + i.fatG, 0));
  const fiber = sumOptional(analysis.items, "fiber_g");
  const sugar = sumOptional(analysis.items, "sugar_g");
  const sodium = sumOptional(analysis.items, "sodium_mg");
  const fiberG = fiber === null ? null : round1(fiber);
  const sugarG = sugar === null ? null : round1(sugar);
  const sodiumMg = sodium === null ? null : Math.round(sodium);

  const { score, factors } = scoreMeal({
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    sodiumMg,
    processing: analysis.processing,
  });

  return {
    ok: true,
    value: {
      name: analysis.name.trim() || items[0]!.name,
      emoji: analysis.emoji && analysis.emoji.length > 0 ? analysis.emoji : null,
      mealType: options.mealType,
      imagePath: options.imagePath ?? null,
      imagePreview: null,
      source: options.source,
      aiTraceId: options.traceId,
      confidence: analysis.confidence,
      calories,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      sugarG,
      sodiumMg,
      servings: 1,
      healthScore: score,
      factors,
      items,
    },
  };
}

export function exerciseAnalysisToInput(analysis: ExerciseAnalysis, loggedAt: string): NormalizeResult<ExerciseInput> {
  if (!analysis.is_exercise) return { ok: false, error: "not_exercise" };
  return {
    ok: true,
    value: {
      loggedAt,
      name: analysis.name.trim() || "Workout",
      durationMin: analysis.duration_min,
      intensity: analysis.intensity,
      calories: analysis.calories,
      source: "text",
    },
  };
}
