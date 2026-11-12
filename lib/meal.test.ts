import { describe, expect, it } from "vitest";
import {
  defaultMealType,
  draftFromSaved,
  draftTotals,
  emptyDraft,
  finalizeMeal,
  loggedAtFor,
  savedFromDraft,
  savedFromMeal,
  stepServings,
} from "./meal";
import type { MealDraft } from "./types";

const draft: MealDraft = {
  ...emptyDraft("lunch"),
  name: "  Chicken rice ",
  calories: 545,
  proteinG: 34,
  carbsG: 64,
  fatG: 15,
  fiberG: 3,
  sugarG: 4,
  sodiumMg: 1050,
  healthScore: 6.5,
  items: [{ name: "Rice", quantity: 1, unit: "bowl", calories: 300, proteinG: 5, carbsG: 56, fatG: 6 }],
};

describe("defaultMealType", () => {
  it("follows the time of day", () => {
    expect(defaultMealType(8 * 60)).toBe("breakfast");
    expect(defaultMealType(12 * 60 + 30)).toBe("lunch");
    expect(defaultMealType(16 * 60)).toBe("snack");
    expect(defaultMealType(19 * 60)).toBe("dinner");
    expect(defaultMealType(23 * 60)).toBe("snack");
    expect(defaultMealType(2 * 60)).toBe("snack");
  });
});

describe("loggedAtFor", () => {
  it("uses the current moment for today", () => {
    const now = new Date("2026-11-11T12:00:00Z"); // 20:00 on 11 Nov, Malaysia time
    expect(loggedAtFor("2026-11-11", now)).toBe(now.toISOString());
  });

  it("keeps the time of day when logging for another date", () => {
    const now = new Date("2026-11-11T12:00:00Z"); // 20:00 MYT
    // 20:00 MYT on 9 Nov is 12:00 UTC on 9 Nov
    expect(loggedAtFor("2026-11-09", now)).toBe("2026-11-09T12:00:00.000Z");
  });
});

describe("finalizeMeal", () => {
  it("multiplies the nutrition by the servings and trims the name", () => {
    const out = finalizeMeal({ ...draft, servings: 2 }, "2026-11-11T05:00:00.000Z");
    expect(out.name).toBe("Chicken rice");
    expect(out.calories).toBe(1090);
    expect(out.proteinG).toBe(68);
    expect(out.sodiumMg).toBe(2100);
    expect(out.servings).toBe(2);
    expect(out.items[0]).toMatchObject({ quantity: 2, calories: 600 });
  });

  it("keeps unknown nutrients unknown", () => {
    const out = finalizeMeal({ ...draft, fiberG: null, sugarG: null, sodiumMg: null, servings: 1.5 }, "x");
    expect(out.fiberG).toBeNull();
    expect(out.sodiumMg).toBeNull();
  });

  it("reports totals for review", () => {
    expect(draftTotals({ ...draft, servings: 0.5 })).toEqual({ calories: 273, proteinG: 17, carbsG: 32, fatG: 7.5 });
  });
});

describe("servings stepper", () => {
  it("moves in halves within limits", () => {
    expect(stepServings(1, 1)).toBe(1.5);
    expect(stepServings(1, -1)).toBe(0.5);
    expect(stepServings(0.5, -1)).toBe(0.5);
    expect(stepServings(20, 1)).toBe(20);
  });
});

describe("saved meals", () => {
  it("round-trips a draft through a favourite", () => {
    const saved = { ...savedFromDraft(draft), id: "s1", createdAt: "2026-11-11T00:00:00Z" };
    expect(saved.name).toBe("Chicken rice");
    const again = draftFromSaved(saved, "dinner");
    expect(again.source).toBe("saved");
    expect(again.mealType).toBe("dinner");
    expect(again.calories).toBe(545);
    expect(again.servings).toBe(1);
  });
});

describe("savedFromMeal", () => {
  it("converts a logged meal back to one serving's nutrition", () => {
    const logged = finalizeMeal({ ...draft, servings: 2 }, "2026-11-11T05:00:00.000Z");
    const meal = {
      id: "m1",
      logDate: "2026-11-11",
      imageUrl: null,
      ...logged,
      items: logged.items.map((i, n) => ({ id: `i${n}`, ...i })),
    };
    const saved = savedFromMeal(meal);
    expect(saved.calories).toBe(545);
    expect(saved.proteinG).toBe(34);
    expect(saved.sodiumMg).toBe(1050);
    expect(saved.items[0]).toMatchObject({ quantity: 1, calories: 300 });
  });
});
