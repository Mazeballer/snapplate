/**
 * Health score presentation. Scores run from 0 to 10; higher is healthier.
 * (Computing a score from a meal's nutrition is added with the AI scan feature.)
 */
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
