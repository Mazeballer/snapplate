import { describe, expect, it } from "vitest";
import {
  bmi,
  bmiCategory,
  bmr,
  calorieTarget,
  clampPace,
  cmToFtIn,
  ftInToCm,
  isFastPace,
  kgToLb,
  lbToKg,
  macroTargets,
  maintenanceCalories,
  paceLevel,
  projectGoalDate,
  round1,
  type BodyStats,
} from "./nutrition";

const male: BodyStats = { sex: "male", weightKg: 80, heightCm: 180, age: 30 };
const female: BodyStats = { sex: "female", weightKg: 60, heightCm: 165, age: 25 };

describe("bmr (Mifflin-St Jeor)", () => {
  it("matches hand-calculated values", () => {
    expect(bmr(male)).toBe(1780); // 800 + 1125 - 150 + 5
    expect(bmr(female)).toBeCloseTo(1345.25, 2); // 600 + 1031.25 - 125 - 161
    expect(bmr({ sex: "other", weightKg: 70, heightCm: 170, age: 30 })).toBeCloseTo(1534.5, 2);
  });
});

describe("maintenanceCalories", () => {
  it("applies the activity multiplier", () => {
    expect(maintenanceCalories(male, "moderate")).toBe(2759);
    expect(maintenanceCalories(male, "light")).toBe(2448); // 1780 * 1.375 = 2447.5
    expect(maintenanceCalories(male, "active")).toBe(3071); // 1780 * 1.725 = 3070.5
    expect(maintenanceCalories(female, "moderate")).toBe(2085);
  });
});

describe("calorieTarget", () => {
  it("returns maintenance for a maintain goal", () => {
    expect(calorieTarget(male, "moderate", "maintain", 0.5)).toEqual({
      calories: 2759,
      maintenance: 2759,
      dailyDelta: 0,
      floored: false,
    });
  });

  it("creates a deficit of about 550 kcal for 0.5 kg per week", () => {
    expect(calorieTarget(male, "moderate", "lose", 0.5)).toEqual({
      calories: 2209,
      maintenance: 2759,
      dailyDelta: -550,
      floored: false,
    });
  });

  it("creates a surplus for gaining", () => {
    const result = calorieTarget(male, "moderate", "gain", 0.5);
    expect(result.calories).toBe(3309);
    expect(result.dailyDelta).toBe(550);
  });

  it("never goes below the safety floor", () => {
    const small: BodyStats = { sex: "female", weightKg: 45, heightCm: 150, age: 40 };
    const result = calorieTarget(small, "light", "lose", 1);
    expect(result.calories).toBe(1200);
    expect(result.floored).toBe(true);
    expect(result.dailyDelta).toBe(1200 - result.maintenance);
  });

  it("clamps an out-of-range pace to 1.5 kg a week, then applies the safety floor", () => {
    const result = calorieTarget(male, "moderate", "lose", 5);
    expect(result.calories).toBe(1500); // 2759 - 1650 would be 1109, below the 1500 floor
    expect(result.floored).toBe(true);
  });

  it("allows a fast gain up to 1.5 kg a week", () => {
    expect(calorieTarget(male, "moderate", "gain", 1.5).dailyDelta).toBe(1650);
  });
});

describe("pace helpers", () => {
  it("clamps to the allowed range", () => {
    expect(clampPace("lose", 3)).toBe(1.5);
    expect(clampPace("lose", 0)).toBe(0.1);
    expect(clampPace("gain", 2)).toBe(1.5);
    expect(clampPace("maintain", 0.5)).toBe(0);
  });

  it("flags aggressive paces", () => {
    expect(isFastPace("lose", 1.1)).toBe(true);
    expect(isFastPace("lose", 1)).toBe(false);
    expect(isFastPace("lose", 0.8)).toBe(false);
    expect(isFastPace("gain", 1.1)).toBe(true);
    expect(isFastPace("maintain", 1)).toBe(false);
  });
});

describe("paceLevel", () => {
  it("bands a metric pace as slow, balanced or fast", () => {
    expect(paceLevel(0.1, "metric")).toBe("slow");
    expect(paceLevel(0.4, "metric")).toBe("slow");
    expect(paceLevel(0.5, "metric")).toBe("balanced");
    expect(paceLevel(1, "metric")).toBe("balanced");
    expect(paceLevel(1.1, "metric")).toBe("fast");
    expect(paceLevel(1.5, "metric")).toBe("fast");
  });

  it("bands an imperial pace by pounds", () => {
    expect(paceLevel(0.45, "imperial")).toBe("slow"); // about 1 lb
    expect(paceLevel(0.5, "imperial")).toBe("balanced"); // about 1.1 lb
    expect(paceLevel(0.9, "imperial")).toBe("balanced"); // about 2 lb
    expect(paceLevel(1, "imperial")).toBe("fast");
  });
});

describe("macroTargets", () => {
  it("splits a balanced 2000 kcal day", () => {
    expect(macroTargets(2000, "balanced")).toEqual({
      proteinG: 150,
      carbsG: 200,
      fatG: 67,
      fiberG: 28,
      sugarG: 50,
      sodiumMg: 2300,
    });
  });

  it("keeps keto carbs very low", () => {
    const keto = macroTargets(2000, "keto");
    expect(keto.carbsG).toBe(25);
    expect(keto.fatG).toBe(156);
    expect(keto.proteinG).toBe(125);
  });

  it("macro calories add back up to roughly the goal for every plan", () => {
    for (const plan of ["balanced", "high_carb", "high_protein", "keto", "low_carb"] as const) {
      const m = macroTargets(2200, plan);
      const total = m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9;
      expect(Math.abs(total - 2200)).toBeLessThan(15);
    }
  });
});

describe("projectGoalDate", () => {
  it("projects 20 weeks to lose 10 kg at 0.5 kg per week", () => {
    const result = projectGoalDate("lose", 80, 70, 0.5, "2026-11-03");
    expect(result?.weeks).toBe(20);
    expect(result?.date).toBe("2027-03-23");
  });

  it("works for gaining", () => {
    expect(projectGoalDate("gain", 60, 65, 0.25, "2026-11-03")?.weeks).toBe(20);
  });

  it("returns null when there is nothing to project", () => {
    expect(projectGoalDate("maintain", 80, 80, 0.5, "2026-11-03")).toBeNull();
    expect(projectGoalDate("lose", 80, 85, 0.5, "2026-11-03")).toBeNull(); // wrong direction
    expect(projectGoalDate("lose", 80, 70, 0, "2026-11-03")).toBeNull();
  });
});

describe("bmi", () => {
  it("computes and categorises", () => {
    expect(bmi(80, 180)).toBeCloseTo(24.69, 2);
    expect(bmiCategory(18.4)).toBe("underweight");
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(24.9)).toBe("normal");
    expect(bmiCategory(25)).toBe("overweight");
    expect(bmiCategory(30)).toBe("obese");
  });
});

describe("unit conversion", () => {
  it("converts weight both ways", () => {
    expect(kgToLb(70)).toBeCloseTo(154.32, 2);
    expect(lbToKg(154.32)).toBeCloseTo(70, 1);
  });

  it("converts height both ways", () => {
    expect(cmToFtIn(180)).toEqual({ feet: 5, inches: 11 });
    expect(cmToFtIn(152.4)).toEqual({ feet: 5, inches: 0 });
    expect(ftInToCm(5, 11)).toBeCloseTo(180.34, 2);
  });

  it("rounds to one decimal", () => {
    expect(round1(72.349)).toBe(72.3);
    expect(round1(72.35)).toBe(72.4);
  });
});
