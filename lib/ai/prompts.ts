import type { AnalysisItem } from "./schema";

/**
 * Instructions for the vision model. The answer's shape is enforced separately by a JSON schema;
 * this text is about getting realistic numbers, especially for the food eaten in Malaysia.
 */
export const MEAL_SYSTEM_INSTRUCTION = `You estimate the nutrition of food and drinks for a calorie tracker used mainly in Malaysia.

Rules:
- List every distinct food or drink as its own item, with a realistic portion: a quantity and a unit such as "1 plate", "1 bowl", "2 pieces", "250 ml" or "120 g".
- The nutrient numbers for an item are for its whole quantity, not per 100 g.
- Use typical Malaysian portion sizes. For reference: nasi lemak with egg about 600 kcal, one roti canai about 300 kcal, a plate of mee goreng about 640 kcal, chicken rice about 550 kcal, teh tarik about 130 kcal, a curry puff about 190 kcal.
- Calories should roughly agree with 4 x protein + 4 x carbs + 9 x fat (within about 15 percent).
- Give fibre (g), sugar (g) and sodium (mg) as best estimates. Use null only when you truly cannot tell.
- processing: "whole" for mostly fresh or home-cooked whole foods, "mixed" for restaurant or hawker food with some processed parts, "ultra" for mostly packaged, fried-and-battered or ready-made items.
- confidence: "high" when the food and portion are clear, "low" when you are mostly guessing.
- If there is no food or drink, set is_food to false, name to "Not food" and items to an empty list.
- name is a short, friendly name for the whole meal. emoji is one fitting food emoji, or null.`;

export const EXERCISE_SYSTEM_INSTRUCTION = `You estimate calories burned by a workout described in plain words, for a fitness tracker.

Rules:
- Work out the activity, how long it lasted and how hard it was. If the duration is missing, assume 30 minutes.
- intensity is "low", "medium" or "high".
- calories is the energy burned in kcal for the whole workout, using the person's body weight when given (otherwise assume 70 kg). Use standard MET values.
- If the text is not a physical activity, set is_exercise to false, name to "Not exercise", duration_min to 1, intensity to "low" and calories to 0.
- name is a short title such as "Running" or "Weight training".`;

export function textMealPrompt(text: string): string {
  return `Estimate the nutrition of this meal that the person describes:\n\n"${text}"`;
}

export function photoMealPrompt(hint?: string): string {
  const note = hint ? `\n\nThe person adds this note about the photo: "${hint}"` : "";
  return `Estimate the nutrition of the food and drinks in this photo.${note}`;
}

export function fixMealPrompt(previous: { name: string; items: AnalysisItem[] }, correction: string, hasImage: boolean): string {
  return `You previously estimated a meal. The person says the estimate needs fixing.

Previous estimate:
${JSON.stringify(previous)}

The person's correction: "${correction}"

Apply the correction and return the full corrected meal in the same format.${hasImage ? " The original photo is attached." : ""}`;
}

export function exercisePrompt(text: string, weightKg?: number): string {
  return `Estimate the calories burned by this workout: "${text}".${weightKg ? ` The person weighs ${Math.round(weightKg)} kg.` : ""}`;
}
