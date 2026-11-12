import { describe, expect, it } from "vitest";
import { exerciseAnalysisToInput, mealAnalysisToDraft } from "./normalize";
import { analyzeRequestSchema, exerciseAnalysisSchema, mealAnalysisSchema } from "./schema";

const chickenRice = {
  is_food: true,
  name: "Chicken rice",
  emoji: "🍗",
  items: [
    { name: "Steamed chicken", quantity: 120, unit: "g", calories: 200, protein_g: 28, carbs_g: 0, fat_g: 9, fiber_g: 0, sugar_g: 0, sodium_mg: 400 },
    { name: "Chicken rice", quantity: 1, unit: "bowl", calories: 300, protein_g: 5, carbs_g: 56, fat_g: 6, fiber_g: 2, sugar_g: 1, sodium_mg: 500 },
  ],
  processing: "mixed",
  confidence: "high",
};

const opts = { source: "photo" as const, traceId: "t1", mealType: "lunch" as const };

describe("mealAnalysisSchema", () => {
  it("accepts a well-formed answer", () => {
    expect(mealAnalysisSchema.safeParse(chickenRice).success).toBe(true);
  });

  it("rejects impossible numbers", () => {
    const bad = { ...chickenRice, items: [{ ...chickenRice.items[0], calories: 999999 }] };
    expect(mealAnalysisSchema.safeParse(bad).success).toBe(false);
    const negative = { ...chickenRice, items: [{ ...chickenRice.items[0], protein_g: -5 }] };
    expect(mealAnalysisSchema.safeParse(negative).success).toBe(false);
  });

  it("rejects a missing field or a wrong enum", () => {
    expect(mealAnalysisSchema.safeParse({ ...chickenRice, processing: "junk" }).success).toBe(false);
    const noName: Record<string, unknown> = { ...chickenRice };
    delete noName.name;
    expect(mealAnalysisSchema.safeParse(noName).success).toBe(false);
  });
});

describe("mealAnalysisToDraft", () => {
  it("adds items up and scores the meal itself", () => {
    const parsed = mealAnalysisSchema.parse(chickenRice);
    const result = mealAnalysisToDraft(parsed, opts);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const draft = result.value;
    expect(draft.calories).toBe(500);
    expect(draft.proteinG).toBe(33);
    expect(draft.carbsG).toBe(56);
    expect(draft.fatG).toBe(15);
    expect(draft.fiberG).toBe(2);
    expect(draft.sodiumMg).toBe(900);
    expect(draft.healthScore).toBeGreaterThan(0);
    expect(draft.factors.length).toBeGreaterThan(0);
    expect(draft.servings).toBe(1);
    expect(draft.source).toBe("photo");
    expect(draft.aiTraceId).toBe("t1");
    expect(draft.emoji).toBe("🍗");
  });

  it("keeps a nutrient unknown when no item reported it", () => {
    const parsed = mealAnalysisSchema.parse({
      ...chickenRice,
      items: chickenRice.items.map((i) => ({ ...i, fiber_g: null, sugar_g: null, sodium_mg: null })),
    });
    const result = mealAnalysisToDraft(parsed, opts);
    expect(result.ok && result.value.fiberG).toBeNull();
    expect(result.ok && result.value.sodiumMg).toBeNull();
  });

  it("reports not food for non-food or an empty list", () => {
    expect(mealAnalysisToDraft(mealAnalysisSchema.parse({ ...chickenRice, is_food: false }), opts)).toEqual({ ok: false, error: "not_food" });
    expect(mealAnalysisToDraft(mealAnalysisSchema.parse({ ...chickenRice, items: [] }), opts)).toEqual({ ok: false, error: "not_food" });
  });

  it("refuses an answer with zero calories", () => {
    const zero = mealAnalysisSchema.parse({ ...chickenRice, items: [{ ...chickenRice.items[0], calories: 0 }] });
    expect(mealAnalysisToDraft(zero, opts)).toEqual({ ok: false, error: "invalid_response" });
  });

  it("falls back to the first item's name", () => {
    const parsed = mealAnalysisSchema.parse({ ...chickenRice, name: "  " });
    const result = mealAnalysisToDraft(parsed, opts);
    expect(result.ok && result.value.name).toBe("Steamed chicken");
  });
});

describe("exercise", () => {
  const run = { is_exercise: true, name: "Running", duration_min: 40, intensity: "high", calories: 450 };

  it("parses and converts a workout", () => {
    const result = exerciseAnalysisToInput(exerciseAnalysisSchema.parse(run), "2026-11-11T05:00:00.000Z");
    expect(result).toEqual({
      ok: true,
      value: { loggedAt: "2026-11-11T05:00:00.000Z", name: "Running", durationMin: 40, intensity: "high", calories: 450, source: "text" },
    });
  });

  it("rejects text that is not a workout", () => {
    const result = exerciseAnalysisToInput(exerciseAnalysisSchema.parse({ ...run, is_exercise: false }), "x");
    expect(result).toEqual({ ok: false, error: "not_exercise" });
  });
});

describe("analyzeRequestSchema", () => {
  it("accepts each request shape", () => {
    expect(analyzeRequestSchema.safeParse({ mode: "text", text: "2 roti canai" }).success).toBe(true);
    expect(analyzeRequestSchema.safeParse({ mode: "photo", image: "a".repeat(200) }).success).toBe(true);
    expect(analyzeRequestSchema.safeParse({ mode: "exercise", text: "30 min run", weightKg: 70 }).success).toBe(true);
    expect(
      analyzeRequestSchema.safeParse({
        mode: "fix",
        correction: "it was two eggs",
        previous: { name: "Omelette", items: chickenRice.items },
      }).success,
    ).toBe(true);
  });

  it("rejects unknown modes, tiny text and oversized images", () => {
    expect(analyzeRequestSchema.safeParse({ mode: "other" }).success).toBe(false);
    expect(analyzeRequestSchema.safeParse({ mode: "text", text: "a" }).success).toBe(false);
    expect(analyzeRequestSchema.safeParse({ mode: "photo", image: "a".repeat(3_100_000) }).success).toBe(false);
  });
});
