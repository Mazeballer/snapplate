import { MOCK_MODE } from "@/lib/mock";
import type { ExerciseInput, MealDraft, NewMealItem } from "@/lib/types";
import type { AnalysisItem, AnalyzeErrorCode, AnalyzeRequest } from "./schema";

/**
 * Asks the server to estimate a meal or workout. In preview mode it returns sample answers
 * instead, so the screens can be tried without an account or the AI.
 */
export type Outcome<T> = { ok: true; value: T } | { ok: false; error: AnalyzeErrorCode };

const KNOWN_ERRORS = new Set<string>([
  "not_food",
  "not_exercise",
  "rate_limited",
  "unavailable",
  "invalid_response",
  "bad_request",
  "unauthorized",
]);

async function post(body: AnalyzeRequest): Promise<{ ok: boolean; error?: string; draft?: MealDraft; exercise?: ExerciseInput }> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as { ok: boolean; error?: string; draft?: MealDraft; exercise?: ExerciseInput };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

function asError(error: string | undefined): AnalyzeErrorCode {
  return error && KNOWN_ERRORS.has(error) ? (error as AnalyzeErrorCode) : "unavailable";
}

async function mealOutcome(body: AnalyzeRequest, preview: () => Promise<MealDraft>): Promise<Outcome<MealDraft>> {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return { ok: true, value: await preview() };
  }
  const result = await post(body);
  if (result.ok && result.draft) return { ok: true, value: result.draft };
  return { ok: false, error: asError(result.error) };
}

export function analyzeText(text: string): Promise<Outcome<MealDraft>> {
  return mealOutcome({ mode: "text", text }, async () => (await import("@/lib/data/mock")).mockAnalyzeMeal(text, "text"));
}

/** `base64` is the resized JPEG; `hint` is an optional note from the person. */
export function analyzePhoto(base64: string, hint?: string): Promise<Outcome<MealDraft>> {
  return mealOutcome(
    { mode: "photo", image: base64, hint: hint?.trim() || undefined },
    async () => (await import("@/lib/data/mock")).mockAnalyzeMeal(hint ?? null, "photo"),
  );
}

/** What the model needs to fix an earlier estimate: the items it produced, in its own format. */
export function itemsForAnalysis(items: NewMealItem[]): AnalysisItem[] {
  return items.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit ?? "",
    calories: i.calories,
    protein_g: i.proteinG,
    carbs_g: i.carbsG,
    fat_g: i.fatG,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
  }));
}

export function fixMeal(draft: MealDraft, correction: string, base64?: string): Promise<Outcome<MealDraft>> {
  return mealOutcome(
    {
      mode: "fix",
      correction,
      previous: { name: draft.name, items: itemsForAnalysis(draft.items) },
      image: base64,
    },
    async () => (await import("@/lib/data/mock")).mockAnalyzeMeal(correction, draft.source === "photo" ? "photo" : "text"),
  );
}

export async function analyzeWorkout(text: string, weightKg?: number): Promise<Outcome<ExerciseInput>> {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const { mockAnalyzeExercise } = await import("@/lib/data/mock");
    const result = mockAnalyzeExercise(text, weightKg ?? 70);
    return result ? { ok: true, value: result } : { ok: false, error: "not_exercise" };
  }
  const result = await post({ mode: "exercise", text, weightKg });
  if (result.ok && result.exercise) return { ok: true, value: result.exercise };
  return { ok: false, error: asError(result.error) };
}
