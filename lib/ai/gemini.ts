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
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const parts: object[] = [{ text: prompt }];
  if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });

  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
          // Thinking for a few seconds adds nothing to a nutrition estimate; "low" is about 3x faster.
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    throw new GeminiError("unavailable", "The request to Gemini failed or timed out");
  }

  if (!response.ok) {
    // Never log the key or the user's photo; the status is enough to diagnose.
    throw new GeminiError("unavailable", `Gemini answered HTTP ${response.status}`);
  }

  try {
    const body = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return JSON.parse(text);
  } catch {
    throw new GeminiError("invalid_response", "Gemini's answer was not valid JSON");
  }
}
