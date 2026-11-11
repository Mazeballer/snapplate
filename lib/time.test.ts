import { afterAll, describe, expect, it } from "vitest";
import {
  addDays,
  ageOn,
  dateRange,
  diffDays,
  endOfLogDate,
  formatClockTime,
  formatDate,
  formatDayLabel,
  isLogDate,
  minutesSinceMidnight,
  parseLogDate,
  startOfLogDate,
  startOfWeek,
  todayLogDate,
  toLogDate,
  weekDates,
  weekdayIndex,
} from "./time";

const originalTz = process.env.TZ;
afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

// The result must be identical whatever timezone the machine or server is in.
describe.each(["UTC", "America/Los_Angeles", "Asia/Kuala_Lumpur", "Pacific/Kiritimati"])(
  "Malaysia day boundaries on a %s machine",
  (zone) => {
    it("keeps 23:59:59 MYT on the same day", () => {
      process.env.TZ = zone;
      expect(toLogDate("2026-11-03T15:59:59Z")).toBe("2026-11-03");
    });

    it("rolls over at 00:00:00 MYT", () => {
      process.env.TZ = zone;
      expect(toLogDate("2026-11-03T16:00:00Z")).toBe("2026-11-04");
    });

    it("treats early UTC morning as the same Malaysian day", () => {
      process.env.TZ = zone;
      expect(toLogDate("2026-11-04T00:30:00Z")).toBe("2026-11-04");
    });

    it("handles a year boundary", () => {
      process.env.TZ = zone;
      expect(toLogDate("2026-12-31T16:00:00Z")).toBe("2027-01-01");
      expect(toLogDate("2026-12-31T15:59:59Z")).toBe("2026-12-31");
    });

    it("reports minutes since midnight in MYT", () => {
      process.env.TZ = zone;
      expect(minutesSinceMidnight("2026-11-03T16:00:00Z")).toBe(0);
      expect(minutesSinceMidnight("2026-11-03T15:59:00Z")).toBe(23 * 60 + 59);
      expect(minutesSinceMidnight("2026-11-03T04:30:00Z")).toBe(12 * 60 + 30);
    });

    it("builds day ranges that line up with the rollover", () => {
      process.env.TZ = zone;
      expect(startOfLogDate("2026-11-04").toISOString()).toBe("2026-11-03T16:00:00.000Z");
      expect(endOfLogDate("2026-11-04").toISOString()).toBe("2026-11-04T16:00:00.000Z");
    });

    it("todayLogDate uses the supplied instant", () => {
      process.env.TZ = zone;
      expect(todayLogDate(new Date("2026-11-03T20:00:00Z"))).toBe("2026-11-04");
    });
  },
);

describe("log date arithmetic", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("counts days between dates", () => {
    expect(diffDays("2026-11-03", "2026-11-10")).toBe(7);
    expect(diffDays("2026-11-10", "2026-11-03")).toBe(-7);
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("builds Monday-first weeks", () => {
    // 2026-11-03 is a Tuesday.
    expect(weekdayIndex("2026-11-03")).toBe(1);
    expect(startOfWeek("2026-11-03")).toBe("2026-11-02");
    expect(startOfWeek("2026-11-08")).toBe("2026-11-02");
    expect(weekDates("2026-11-03")).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("builds inclusive ranges", () => {
    expect(dateRange("2026-11-01", "2026-11-03")).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"]);
    expect(dateRange("2026-11-03", "2026-11-01")).toEqual([]);
  });
});

describe("validation", () => {
  it("rejects impossible dates", () => {
    expect(isLogDate("2026-02-30")).toBe(false);
    expect(isLogDate("2026-13-01")).toBe(false);
    expect(isLogDate("2026-1-1")).toBe(false);
    expect(isLogDate("2026-11-03")).toBe(true);
    expect(() => parseLogDate("nope")).toThrow(RangeError);
  });

  it("rejects invalid instants", () => {
    expect(() => toLogDate("not a date")).toThrow(RangeError);
  });
});

describe("age", () => {
  it("is birthday-aware", () => {
    expect(ageOn("1996-11-04", "2026-11-03")).toBe(29);
    expect(ageOn("1996-11-03", "2026-11-03")).toBe(30);
    expect(ageOn("1996-12-25", "2026-11-03")).toBe(29);
  });
});

describe("formatting", () => {
  it("writes a date out in full", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(formatDate("2026-11-03")).toMatch(/Tue,? 3 Nov/);
  });

  it("labels nearby days", () => {
    expect(formatDayLabel("2026-11-03", "2026-11-03")).toBe("Today");
    expect(formatDayLabel("2026-11-02", "2026-11-03")).toBe("Yesterday");
    expect(formatDayLabel("2026-11-04", "2026-11-03")).toBe("Tomorrow");
    expect(formatDayLabel("2026-10-30", "2026-11-03")).toMatch(/Fri/);
  });

  it("formats clock time in MYT regardless of machine timezone", () => {
    process.env.TZ = "America/Los_Angeles";
    expect(formatClockTime("2026-11-03T05:05:00Z")).toBe("1:05 pm");
  });
});
