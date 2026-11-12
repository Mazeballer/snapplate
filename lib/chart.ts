/** Small pure helpers for drawing the weight chart. */
import { addDays, diffDays, parseLogDate, type LogDate } from "./time";

export interface Pt {
  x: number;
  y: number;
}

const f = (n: number) => n.toFixed(2);

/**
 * A smooth line through the points that never overshoots them (monotone cubic interpolation), so
 * the curve cannot dip below a weigh-in or rise above one between two readings.
 */
export function smoothPath(points: Pt[]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${f(points[0]!.x)},${f(points[0]!.y)}`;
  if (n === 2) return `M${f(points[0]!.x)},${f(points[0]!.y)}L${f(points[1]!.x)},${f(points[1]!.y)}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]!.x - points[i]!.x);
    slope.push(dx[i]! === 0 ? 0 : (points[i + 1]!.y - points[i]!.y) / dx[i]!);
  }
  const tangent: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(slope[i - 1]! * slope[i]! <= 0 ? 0 : (slope[i - 1]! + slope[i]!) / 2);
  }
  tangent.push(slope[n - 2]!);
  // Limit the tangents so the curve stays between neighbouring points.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / slope[i]!;
    const b = tangent[i + 1]! / slope[i]!;
    const h = Math.hypot(a, b);
    if (h > 3) {
      tangent[i] = (3 * a * slope[i]!) / h;
      tangent[i + 1] = (3 * b * slope[i]!) / h;
    }
  }

  let d = `M${f(points[0]!.x)},${f(points[0]!.y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p = points[i]!;
    const q = points[i + 1]!;
    const w = dx[i]! / 3;
    d += `C${f(p.x + w)},${f(p.y + w * tangent[i]!)},${f(q.x - w)},${f(q.y - w * tangent[i + 1]!)},${f(q.x)},${f(q.y)}`;
  }
  return d;
}

/** The index of the value in `xs` (ascending) closest to `x`. */
export function nearestIndex(xs: readonly number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) {
    if (Math.abs(xs[i]! - x) < Math.abs(xs[best]! - x)) best = i;
  }
  return best;
}

export type WeightRange = "90D" | "6M" | "1Y" | "ALL";

export const RANGE_DAYS: Record<Exclude<WeightRange, "ALL">, number> = { "90D": 90, "6M": 182, "1Y": 365 };

/** The first date a range shows, or null for "all time". */
export function rangeStart(range: WeightRange, today: LogDate): LogDate | null {
  return range === "ALL" ? null : addDays(today, -RANGE_DAYS[range]);
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

/**
 * Month labels for the time axis: each month that starts inside the range, placed by date.
 * `position` runs from 0 (first date) to 1 (last date).
 */
export function monthTicks(from: LogDate, to: LogDate): { date: LogDate; label: string; position: number }[] {
  const span = diffDays(from, to);
  if (span <= 0) return [];
  const ticks: { date: LogDate; label: string; position: number }[] = [];
  const start = parseLogDate(from);
  let year = start.year;
  let month = start.month;
  for (let guard = 0; guard < 40; guard++) {
    const date = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
    if (date > to) break;
    if (date >= from) {
      ticks.push({ date, label: MONTH.format(new Date(Date.UTC(year, month - 1, 1, 12))), position: diffDays(from, date) / span });
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return ticks;
}

/**
 * How far along the goal someone is, from 0 to 1: how much of the distance from their starting
 * weight to the goal weight is covered. Null when there is no distance to cover.
 */
export function goalProgress(startKg: number, currentKg: number, goalKg: number): number | null {
  const total = goalKg - startKg;
  if (Math.abs(total) < 0.05) return null;
  return Math.min(1, Math.max(0, (currentKg - startKg) / total));
}
