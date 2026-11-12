/**
 * Health score presentation. Scores run from 0 to 10; higher is healthier.
 * scoreMeal() below calculates a score for a new meal from its nutrition.
 */
import type { HealthFactor } from "./types";

export type HealthTone = "great" | "good" | "fair" | "poor" | "bad";

export interface HealthBand {
  label: string;
  tone: HealthTone;
}

export function healthBand(score: number): HealthBand {
  if (score >= 9) return { label: "Excellent", tone: "great" };
  if (score >= 7) return { label: "Healthy", tone: "good" };
  if (score >= 5) return { label: "Fair", tone: "fair" };
  if (score >= 3) return { label: "Unhealthy", tone: "poor" };
  return { label: "Very unhealthy", tone: "bad" };
}

/** Tailwind classes for a score chip, one per tone. */
export const HEALTH_TONE_CLASSES: Record<HealthTone, string> = {
  great: "bg-success/15 text-success",
  good: "bg-success/15 text-success",
  fair: "bg-warning/20 text-foreground",
  poor: "bg-danger/15 text-danger",
  bad: "bg-danger/15 text-danger",
};

export const clampScore = (score: number): number => Math.min(10, Math.max(0, score));

/** "7.5" or "8": one decimal only when it is needed. */
export function formatScore(score: number): string {
  const rounded = Math.round(clampScore(score) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

// --- scoring a meal --------------------------------------------------------------------------

/** How processed the food is: whole foods, a mix, or mostly ready-made and packaged. */
export type Processing = "whole" | "mixed" | "ultra";

export interface ScoreInput {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  processing: Processing;
}

export interface MealScore {
  /** 0 to 10, one decimal. */
  score: number;
  factors: HealthFactor[];
}

const BASE_SCORE = 9;

/**
 * Snapplate's own health score for a meal. It is a simple, explainable heuristic, not medical
 * advice: it starts at 9 and moves with sugar, sodium, fibre, fat and protein relative to the
 * calories in the meal, and with how processed the food is. Every move is listed as a factor so
 * the person can see why a meal scored the way it did.
 */
export function scoreMeal(input: ScoreInput): MealScore {
  // Densities are per 100 kcal so a snack and a big plate are judged fairly. Tiny entries are
  // judged as if they were 50 kcal, to avoid wild swings.
  const per100 = Math.max(input.calories, 50) / 100;
  const factors: HealthFactor[] = [];
  let score = BASE_SCORE;

  if (input.sugarG !== null) {
    const d = input.sugarG / per100;
    if (d <= 2.5) factors.push({ label: "Sugar", quality: "good", note: "Low in sugar." });
    else if (d <= 6) {
      score -= 1;
      factors.push({ label: "Sugar", quality: "fair", note: "Some sugar." });
    } else {
      score -= 2.5;
      factors.push({ label: "Sugar", quality: "bad", note: "High in sugar for its calories." });
    }
  }

  if (input.sodiumMg !== null) {
    const d = input.sodiumMg / per100;
    if (d <= 110) factors.push({ label: "Sodium", quality: "good", note: "Low in salt." });
    else if (d <= 200) {
      score -= 1;
      factors.push({ label: "Sodium", quality: "fair", note: "A fair amount of salt." });
    } else {
      score -= 2.5;
      factors.push({ label: "Sodium", quality: "bad", note: "Very salty for its calories." });
    }
  }

  if (input.fiberG !== null) {
    const d = input.fiberG / per100;
    if (d >= 1.2) {
      score += 0.5;
      factors.push({ label: "Fibre", quality: "good", note: "Good amount of fibre." });
    } else if (d >= 0.6) factors.push({ label: "Fibre", quality: "fair", note: "Could use more fibre." });
    else {
      score -= 1.5;
      factors.push({ label: "Fibre", quality: "bad", note: "Very little fibre." });
    }
  }

  const fatShare = (input.fatG * 9) / Math.max(input.calories, 50);
  if (fatShare > 0.5) {
    score -= 1.5;
    factors.push({ label: "Fat", quality: "bad", note: "Most of the calories come from fat." });
  } else if (fatShare > 0.35) {
    score -= 0.5;
    factors.push({ label: "Fat", quality: "fair", note: "On the fatty side." });
  }

  if (input.processing === "whole") {
    score += 0.5;
    factors.push({ label: "Processing", quality: "good", note: "Mostly whole foods." });
  } else if (input.processing === "mixed") {
    score -= 0.5;
    factors.push({ label: "Processing", quality: "fair", note: "Some processed ingredients." });
  } else {
    score -= 2;
    factors.push({ label: "Processing", quality: "bad", note: "Heavily processed." });
  }

  if ((input.proteinG * 4) / Math.max(input.calories, 50) >= 0.25) {
    score += 0.5;
    factors.push({ label: "Protein", quality: "good", note: "Good source of protein." });
  }

  return { score: Math.round(clampScore(score) * 10) / 10, factors };
}
