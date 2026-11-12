/**
 * Calories burned by a workout, from standard MET values (metabolic equivalents):
 * calories = MET x body weight in kg x hours. Used for the quick Run and Weight lifting entries;
 * the AI estimate handles free-text workouts.
 */
import type { ExerciseIntensity } from "./types";

export type WorkoutKind = "run" | "weights";

export const WORKOUT_MET: Record<WorkoutKind, Record<ExerciseIntensity, number>> = {
  run: { low: 8.3, medium: 9.8, high: 11.8 },
  weights: { low: 3.5, medium: 5, high: 6 },
};

export const WORKOUT_NAME: Record<WorkoutKind, string> = {
  run: "Running",
  weights: "Weight lifting",
};

/** Used when the person's weight is not known yet. */
export const DEFAULT_WEIGHT_KG = 70;

export function estimateWorkoutCalories(
  kind: WorkoutKind,
  intensity: ExerciseIntensity,
  minutes: number,
  weightKg: number | null,
): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const kg = weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  return Math.round((WORKOUT_MET[kind][intensity] * kg * minutes) / 60);
}

/** Quick duration choices, in minutes. */
export const DURATION_PRESETS = [15, 30, 60, 90] as const;
