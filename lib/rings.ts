/**
 * The calendar ring colour for a day, from how close the calories eaten were to the goal.
 *
 *   empty         nothing logged that day
 *   under         more than 100 kcal below goal (still room, or an incomplete day)
 *   on            within 100 kcal of goal
 *   slightly_over 100-199 kcal over
 *   over          200 kcal or more over
 */
export type RingState = "empty" | "under" | "on" | "slightly_over" | "over";

export const RING_TOLERANCE_KCAL = 100;
export const RING_OVER_KCAL = 200;

export function ringState(eaten: number, goal: number, hasLogs: boolean): RingState {
  if (!hasLogs) return "empty";
  const diff = eaten - goal;
  if (diff >= RING_OVER_KCAL) return "over";
  if (diff > RING_TOLERANCE_KCAL) return "slightly_over";
  if (diff >= -RING_TOLERANCE_KCAL) return "on";
  return "under";
}

/** Fraction of the goal eaten, from 0 to 1 (never above 1). */
export function ringProgress(eaten: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, eaten / goal));
}
