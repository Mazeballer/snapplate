import { describe, expect, it } from "vitest";
import {
  formatGrams,
  formatNumber,
  formatWater,
  formatWeight,
  formatWeightChange,
} from "./format";
import { formatLongDate, formatShortDate } from "./time";

describe("numbers", () => {
  it("adds thousands separators and rounds", () => {
    expect(formatNumber(2137.4)).toBe("2,137");
    expect(formatNumber(999.5)).toBe("1,000");
    expect(formatGrams(84.6)).toBe("85g");
  });
});

describe("weight", () => {
  it("formats in the chosen units", () => {
    expect(formatWeight(78.24, "metric")).toBe("78.2 kg");
    expect(formatWeight(70, "imperial")).toBe("154.3 lb");
  });

  it("signs changes", () => {
    expect(formatWeightChange(-1.64, "metric")).toBe("-1.6 kg");
    expect(formatWeightChange(0.4, "metric")).toBe("+0.4 kg");
    expect(formatWeightChange(0, "metric")).toBe("0 kg");
  });
});

describe("water", () => {
  it("uses litres from one litre up", () => {
    expect(formatWater(500)).toBe("500 ml");
    expect(formatWater(1250)).toBe("1.25 L");
    expect(formatWater(2000)).toBe("2 L");
  });
});

describe("short dates", () => {
  it("formats day and month, and with year", () => {
    expect(formatShortDate("2026-11-03")).toBe("3 Nov");
    expect(formatLongDate("2027-03-23")).toBe("23 Mar 2027");
  });
});
