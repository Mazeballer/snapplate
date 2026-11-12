import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GeminiError, generateJson } from "@/lib/ai/gemini";
import { exerciseAnalysisToInput, mealAnalysisToDraft } from "@/lib/ai/normalize";
import {
  EXERCISE_SYSTEM_INSTRUCTION,
  MEAL_SYSTEM_INSTRUCTION,
  exercisePrompt,
  fixMealPrompt,
  photoMealPrompt,
  textMealPrompt,
} from "@/lib/ai/prompts";
import {
  EXERCISE_RESPONSE_SCHEMA,
  MEAL_RESPONSE_SCHEMA,
  analyzeRequestSchema,
  exerciseAnalysisSchema,
  mealAnalysisSchema,
  type AnalyzeErrorCode,
} from "@/lib/ai/schema";
import { defaultMealType } from "@/lib/meal";
import { minutesSinceMidnight } from "@/lib/time";
import { createClient } from "@/lib/supabase/server";

// A vision call can take a few seconds; give the function room on Vercel.
export const maxDuration = 30;

const dailyLimit = z.coerce.number().int().min(1).max(1000).catch(30);

function fail(error: AnalyzeErrorCode, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/**
 * Estimates the nutrition of a meal (from a photo or words), corrects an earlier estimate, or
 * estimates a workout. Only signed-in, allowlisted people may call it, each is capped per day,
 * and the AI's answer is validated before it is returned.
 */
export async function POST(request: NextRequest) {
  // A plain HTML form cannot send JSON, so this blocks cross-site form posts.
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return fail("bad_request", 415);
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return fail("unauthorized", 401);
  const { data: allowed, error: allowError } = await supabase.rpc("is_allowed");
  if (allowError || allowed !== true) return fail("unauthorized", 403);

  let parsed;
  try {
    parsed = analyzeRequestSchema.safeParse(await request.json());
  } catch {
    return fail("bad_request", 400);
  }
  if (!parsed.success) return fail("bad_request", 400);
  const req = parsed.data;

  // Count this call against today's allowance before spending money on the AI.
  const { data: within, error: limitError } = await supabase.rpc("consume_ai_scan", {
    max_per_day: dailyLimit.parse(process.env.AI_SCANS_PER_DAY),
  });
  if (limitError) return fail("unavailable", 503);
  if (within !== true) return fail("rate_limited", 429);

  const traceId = crypto.randomUUID();
  try {
    if (req.mode === "exercise") {
      const raw = await generateJson({
        systemInstruction: EXERCISE_SYSTEM_INSTRUCTION,
        prompt: exercisePrompt(req.text, req.weightKg),
        responseSchema: EXERCISE_RESPONSE_SCHEMA,
      });
      const checked = exerciseAnalysisSchema.safeParse(raw);
      if (!checked.success) return fail("invalid_response", 502);
      const result = exerciseAnalysisToInput(checked.data, new Date().toISOString());
      if (!result.ok) return NextResponse.json({ ok: false, error: result.error });
      return NextResponse.json({ ok: true, exercise: result.value });
    }

    const prompt =
      req.mode === "photo"
        ? photoMealPrompt(req.hint)
        : req.mode === "text"
          ? textMealPrompt(req.text)
          : fixMealPrompt(req.previous, req.correction, Boolean(req.image));
    const image = req.mode === "photo" || req.mode === "fix" ? req.image : undefined;

    const raw = await generateJson({
      systemInstruction: MEAL_SYSTEM_INSTRUCTION,
      prompt,
      imageBase64: image,
      responseSchema: MEAL_RESPONSE_SCHEMA,
    });
    const checked = mealAnalysisSchema.safeParse(raw);
    if (!checked.success) return fail("invalid_response", 502);

    const result = mealAnalysisToDraft(checked.data, {
      source: req.mode === "text" ? "text" : "photo",
      traceId,
      mealType: defaultMealType(minutesSinceMidnight()),
    });
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error });
    return NextResponse.json({ ok: true, draft: result.value });
  } catch (error) {
    if (error instanceof GeminiError) {
      console.error(`[analyze ${traceId}] ${error.kind}: ${error.message}`);
      return fail(error.kind, 502);
    }
    console.error(`[analyze ${traceId}] unexpected error`);
    return fail("unavailable", 500);
  }
}
