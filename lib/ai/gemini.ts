import "server-only";

/**
 * A small client for Google's Gemini API, used only from the server so the key never reaches the
 * browser. It asks for JSON in a fixed shape and returns the parsed (still untrusted) answer.
 */

export class GeminiError extends Error {
  constructor(
    readonly kind: "unavailable" | "invalid_response",
    message: string,
  ) {
    super(message);
  }
}

const DEFAULT_MODEL = "gemini-3.5-flash";
/** Tried when the main model is overloaded or times out, so a busy moment doesn't fail a scan. */
const FALLBACK_MODELS = ["gemini-3-flash-preview", "gemini-3.1-flash-lite"];
const ATTEMPT_TIMEOUT_MS = 9_000;
/** Overload, rate limit and server errors are worth trying another model for; bad requests are not. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export interface GenerateJsonOptions {
  systemInstruction: string;
  prompt: string;
  /** A base64 JPEG to attach, if the question is about a photo. */
  imageBase64?: string;
  responseSchema: object;
}

export async function generateJson({ systemInstruction, prompt, imageBase64, responseSchema }: GenerateJsonOptions): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("unavailable", "GEMINI_API_KEY is not set");
  const main = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const models = [main, ...FALLBACK_MODELS.filter((m) => m !== main)];

  const parts: object[] = [{ text: prompt }];
  if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
      // Thinking for a few seconds adds nothing to a nutrition estimate; "low" is about 3x faster.
      thinkingConfig: { thinkingLevel: "low" },
    },
  });

  let response: Response | null = null;
  let failure = "The request to Gemini failed or timed out";
  for (const model of models) {
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch {
      response = null;
      continue;
    }
    if (response.ok) break;
    // Never log the key or the user's photo; the status is enough to diagnose.
    failure = `Gemini answered HTTP ${response.status} (${model})`;
    if (!RETRYABLE.has(response.status)) break;
    response = null;
  }
  if (!response?.ok) throw new GeminiError("unavailable", failure);

  try {
    const json = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return JSON.parse(text);
  } catch {
    throw new GeminiError("invalid_response", "Gemini's answer was not valid JSON");
  }
}
