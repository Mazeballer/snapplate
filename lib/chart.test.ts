import { describe, expect, it } from "vitest";
import { goalProgress, monthTicks, nearestIndex, rangeStart, smoothPath } from "./chart";

describe("smoothPath", () => {
  it("handles tiny inputs", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([{ x: 1, y: 2 }])).toBe("M1.00,2.00");
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 5 }])).toBe("M0.00,0.00L10.00,5.00");
  });

  it("makes one curve segment between each pair of points, ending on the last", () => {
    const d = smoothPath([{ x: 0, y: 10 }, { x: 10, y: 4 }, { x: 20, y: 8 }, { x: 30, y: 2 }]);
    expect(d.startsWith("M0.00,10.00")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    expect(d.endsWith("30.00,2.00")).toBe(true);
  });

  it("never overshoots: every control point stays within the neighbouring y values", () => {
    const pts = [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 20, y: 0 }, { x: 30, y: 0 }];
    const nums = smoothPath(pts).match(/C([^C]+)/g)!.map((seg) => seg.slice(1).split(",").map(Number));
    for (const [, c1y, , c2y] of nums) {
      expect(c1y).toBeGreaterThanOrEqual(-0.001);
      expect(c1y).toBeLessThanOrEqual(10.001);
      expect(c2y).toBeGreaterThanOrEqual(-0.001);
      expect(c2y).toBeLessThanOrEqual(10.001);
    }
  });
});

describe("nearestIndex", () => {
  it("finds the closest value", () => {
    expect(nearestIndex([0, 10, 25, 40], 12)).toBe(1);
    expect(nearestIndex([0, 10, 25, 40], 100)).toBe(3);
    expect(nearestIndex([0, 10, 25, 40], -5)).toBe(0);
  });
});

describe("rangeStart", () => {
  it("counts back from today, or shows everything", () => {
    expect(rangeStart("90D", "2026-11-11")).toBe("2026-08-13");
    expect(rangeStart("1Y", "2026-11-11")).toBe("2025-11-11");
    expect(rangeStart("ALL", "2026-11-11")).toBeNull();
  });
});

describe("monthTicks", () => {
  it("labels each month that starts inside the range", () => {
    const ticks = monthTicks("2026-08-13", "2026-11-11");
    expect(ticks.map((t) => t.label)).toEqual(["Sep", "Oct", "Nov"]);
    expect(ticks[0]!.position).toBeGreaterThan(0);
    expect(ticks[2]!.position).toBeLessThan(1);
  });

  it("crosses a year end", () => {
    expect(monthTicks("2026-11-20", "2027-02-10").map((t) => t.label)).toEqual(["Dec", "Jan", "Feb"]);
  });

  it("has nothing for an empty span", () => {
    expect(monthTicks("2026-11-11", "2026-11-11")).toEqual([]);
  });
});

describe("goalProgress", () => {
  it("measures how far from start to goal", () => {
    expect(goalProgress(82, 78, 72)).toBeCloseTo(0.4, 5); // 4 of 10 kg
    expect(goalProgress(60, 63, 66)).toBeCloseTo(0.5, 5); // gaining
  });

  it("is clamped and null when there is nowhere to go", () => {
    expect(goalProgress(82, 90, 72)).toBe(0); // went the wrong way
    expect(goalProgress(82, 70, 72)).toBe(1); // overshot the goal
    expect(goalProgress(70, 70, 70)).toBeNull();
  });
});
