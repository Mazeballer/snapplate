import { describe, expect, it } from "vitest";
import { cacheKeyFor, clearSavedCaches, shouldPersist } from "./persist";

function fakeStorage(initial: Record<string, string>) {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    keys: () => [...data.keys()],
  };
}

describe("saved data on the device", () => {
  it("keeps one copy per account", () => {
    expect(cacheKeyFor("a")).not.toBe(cacheKeyFor("b"));
  });

  it("saves only the app's own data, and only when it loaded successfully", () => {
    expect(shouldPersist(["meals", "2026-11-01", "2026-11-18"], "success")).toBe(true);
    expect(shouldPersist(["profile"], "success")).toBe(true);
    expect(shouldPersist(["meals", "a", "b"], "error")).toBe(false);
    expect(shouldPersist(["meals", "a", "b"], "pending")).toBe(false);
    expect(shouldPersist(["health-sync"], "success")).toBe(false);
    expect(shouldPersist([], "success")).toBe(false);
  });

  it("wipes every account's saved copy on logout and leaves other storage alone", () => {
    const storage = fakeStorage({
      [cacheKeyFor("user-1")]: "x",
      [cacheKeyFor("user-2")]: "y",
      "snapplate:ring-explainer-dismissed": "1",
      theme: "dark",
    });
    clearSavedCaches(storage);
    expect(storage.keys().sort()).toEqual(["snapplate:ring-explainer-dismissed", "theme"]);
  });
});
