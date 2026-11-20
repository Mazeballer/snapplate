/** Error codes the AI endpoint can answer with, and what to tell the person. Kept free of zod so screens can import it cheaply. */
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
