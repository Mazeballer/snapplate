import { describe, expect, it } from "vitest";
import { fitWithin } from "./image";

describe("fitWithin", () => {
  it("scales the longest side down to the limit", () => {
    expect(fitWithin(4000, 3000, 1024)).toEqual({ width: 1024, height: 768 });
    expect(fitWithin(3000, 4000, 1024)).toEqual({ width: 768, height: 1024 });
  });

  it("never scales up", () => {
    expect(fitWithin(800, 600, 1024)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1024, 1024, 1024)).toEqual({ width: 1024, height: 1024 });
  });

  it("keeps at least one pixel on a thin image", () => {
    expect(fitWithin(10000, 1, 1024).height).toBe(1);
  });
});
