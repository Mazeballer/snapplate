import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateJson, GeminiError } from "./gemini";

const ok = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const status = (code: number) => new Response("{}", { status: code });
const opts = { systemInstruction: "s", prompt: "p", responseSchema: {} };

function modelsCalled(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]).match(/models\/([^:]+):/)![1]!);
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-key");
  vi.stubEnv("GEMINI_MODEL", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("generateJson model fallback", () => {
  it("uses only the main model when it answers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok('{"a":1}'));
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateJson(opts)).toEqual({ a: 1 });
    expect(modelsCalled(fetchMock)).toEqual(["gemini-3.5-flash"]);
  });

  it("tries the next model when the main one is overloaded", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(status(503)).mockResolvedValueOnce(ok('{"a":2}'));
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateJson(opts)).toEqual({ a: 2 });
    expect(modelsCalled(fetchMock)).toEqual(["gemini-3.5-flash", "gemini-3-flash-preview"]);
  });

  it("tries the next model when a request times out", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(ok('{"a":3}'));
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateJson(opts)).toEqual({ a: 3 });
  });

  it("does not retry a bad request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(400));
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateJson(opts)).rejects.toBeInstanceOf(GeminiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up with an unavailable error when every model fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(status(503));
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateJson(opts)).rejects.toMatchObject({ kind: "unavailable" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
