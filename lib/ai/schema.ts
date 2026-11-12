import { z } from "zod";

/**
 * The shapes the food and exercise analysis passes around: what the browser may send to
 * /api/analyze, and what the AI must answer with. The AI's JSON is untrusted, so every number is
 * range-checked before it is used.
 */

const amount = (max: number) => z.number().finite().min(0).max(max);

export const analysisItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().finite().positive().max(10_000),
  unit: z.string().trim().max(30),
  calories: amount(5000),
  protein_g: amount(500),
  carbs_g: amount(1000),
  fat_g: amount(500),
  fiber_g: amount(200).nullable(),
  sugar_g: amount(500).nullable(),
  sodium_mg: amount(20_000).nullable(),
});

export const mealAnalysisSchema = z.object({
  is_food: z.boolean(),
  name: z.string().trim().max(120),
  emoji: z.string().trim().max(8).nullable(),
  items: z.array(analysisItemSchema).max(25),
  processing: z.enum(["whole", "mixed", "ultra"]),
  confidence: z.enum(["high", "medium", "low"]),
});

export const exerciseAnalysisSchema = z.object({
  is_exercise: z.boolean(),
  name: z.string().trim().max(120),
  duration_min: z.number().int().min(1).max(1440),
  intensity: z.enum(["low", "medium", "high"]),
  calories: z.number().int().min(0).max(5000),
});

export type AnalysisItem = z.infer<typeof analysisItemSchema>;
export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;
export type ExerciseAnalysis = z.infer<typeof exerciseAnalysisSchema>;

const IMAGE_MAX = 3_000_000; // base64 characters; a resized photo is far smaller

export const analyzeRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("photo"),
    image: z.string().min(100).max(IMAGE_MAX),
    hint: z.string().trim().max(300).optional(),
  }),
  z.object({ mode: z.literal("text"), text: z.string().trim().min(2).max(500) }),
  z.object({
    mode: z.literal("fix"),
    correction: z.string().trim().min(2).max(500),
    previous: z.object({ name: z.string().trim().max(120), items: z.array(analysisItemSchema).max(25) }),
    image: z.string().min(100).max(IMAGE_MAX).optional(),
  }),
  z.object({
    mode: z.literal("exercise"),
    text: z.string().trim().min(2).max(300),
    weightKg: z.number().min(20).max(500).optional(),
  }),
]);

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export type AnalyzeErrorCode =
  | "not_food"
  | "not_exercise"
  | "rate_limited"
  | "unavailable"
  | "invalid_response"
  | "bad_request"
  | "unauthorized";

export const ERROR_MESSAGES: Record<AnalyzeErrorCode, string> = {
  not_food: "We couldn't find any food. Try a clearer photo or describe it in words.",
  not_exercise: "That doesn't look like a workout. Try something like “30 min run”.",
  rate_limited: "You've reached today's limit for AI estimates. You can still add meals by hand.",
  unavailable: "The AI service is busy right now. Please try again in a moment.",
  invalid_response: "We couldn't read the estimate. Please try again.",
  bad_request: "That request wasn't valid. Please try again.",
  unauthorized: "Please sign in again.",
};

// --- the JSON schema sent to Gemini so it answers in this exact shape -------------------------------

const num = { type: "number" } as const;
const numOrNull = { type: "number", nullable: true } as const;

export const MEAL_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_food: { type: "boolean" },
    name: { type: "string" },
    emoji: { type: "string", nullable: true },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: num,
          unit: { type: "string" },
          calories: num,
          protein_g: num,
          carbs_g: num,
          fat_g: num,
          fiber_g: numOrNull,
          sugar_g: numOrNull,
          sodium_mg: numOrNull,
        },
        required: ["name", "quantity", "unit", "calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg"],
      },
    },
    processing: { type: "string", enum: ["whole", "mixed", "ultra"] },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["is_food", "name", "emoji", "items", "processing", "confidence"],
} as const;

export const EXERCISE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    is_exercise: { type: "boolean" },
    name: { type: "string" },
    duration_min: { type: "integer" },
    intensity: { type: "string", enum: ["low", "medium", "high"] },
    calories: { type: "integer" },
  },
  required: ["is_exercise", "name", "duration_min", "intensity", "calories"],
} as const;
