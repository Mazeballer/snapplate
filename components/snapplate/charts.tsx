"use client";

import { useState } from "react";
import { RING_COLORS } from "@/components/snapplate/ring-colors";
import { monthTicks, nearestIndex, smoothPath } from "@/lib/chart";
import { formatNumber } from "@/lib/format";
import type { RingState } from "@/lib/rings";
import { addDays, diffDays, formatLongDate, formatShortDate, type LogDate } from "@/lib/time";

/**
 * Two small SVG charts drawn by hand: a weight trend and a week of calories. They scale to the
 * width of their card (the viewBox keeps the proportions) and need no chart library.
 */

const W = 340;
const AXIS_W = 34; // room on the left for the y-axis labels
const RIGHT = 6;

export interface WeightPoint {
  date: LogDate;
  value: number;
}

/** A tidy step (1, 2, 5, 10, ...) so the y axis lands on round numbers. */
function niceStep(rough: number): number {
  for (const step of [1, 2, 5, 10, 20, 50]) if (step >= rough) return step;
  return 100;
}

/**
 * The weight trend: a smooth line with dotted gridlines. Touch or drag along it to read a weigh-in;
 * the line is green up to the chosen point and dark after it, with a dark bubble showing the value.
 * Arrow keys move the choice too.
 */
export function WeightChart({
  points,
  unit,
  summary,
}: {
  points: WeightPoint[];
  unit: string;
  /** Read out by screen readers in place of the picture. */
  summary: string;
}) {
  const H = 236;
  const top = 46;
  const bottom = 30;
  const left = 34;
  const right = 10;
  const plotH = H - top - bottom;
  const plotW = W - left - right;
  const [chosen, setChosen] = useState<number | null>(null);
  const index = Math.min(points.length - 1, chosen ?? points.length - 1);

  const values = points.map((p) => p.value);
  const rough = (Math.ceil(Math.max(...values) + 1) - Math.floor(Math.min(...values) - 1)) / 4;
  const step = niceStep(rough);
  const yMin = Math.floor((Math.min(...values) - 1) / step) * step;
  const yMax = Math.max(yMin + step * 4, Math.ceil((Math.max(...values) + 1) / step) * step);
  const ticks: number[] = [];
  for (let t = yMin; t <= yMax + 0.001; t += step) ticks.push(t);

  const first = points[0]!.date;
  const last = points[points.length - 1]!.date;
  const span = Math.max(1, diffDays(first, last));
  const x = (date: LogDate) => left + (diffDays(first, date) / span) * plotW;
  const y = (v: number) => top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  const xs = points.map((p) => x(p.date));
  const pts = points.map((p, i) => ({ x: xs[i]!, y: y(p.value) }));

  const line = smoothPath(pts);
  const area = `${line}L${xs[xs.length - 1]!.toFixed(2)},${top + plotH}L${xs[0]!.toFixed(2)},${top + plotH}Z`;
  const selected = points[index]!;
  const sx = xs[index]!;
  const sy = pts[index]!.y;

  const ticksX = span > 45 ? monthTicks(first, last) : [0, 1 / 3, 2 / 3, 1].map((position) => ({ date: addDays(first, Math.round(position * span)), label: formatShortDate(addDays(first, Math.round(position * span))), position }));

  // Bubble: centred above the chosen point, kept inside the chart.
  const bubbleW = 92;
  const bubbleX = Math.min(W - right - bubbleW, Math.max(left, sx - bubbleW / 2));
  const bubbleY = Math.max(2, sy - 58);

  function pick(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    setChosen(nearestIndex(xs, px));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const move = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!move) return;
    event.preventDefault();
    setChosen(Math.min(points.length - 1, Math.max(0, index + move)));
  }

  const clipId = "weight-clip";
  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none focus-visible:outline-2"
        role="img"
        aria-label={summary}
        tabIndex={0}
        onPointerMove={pick}
        onPointerDown={pick}
        onKeyDown={onKeyDown}
      >
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={sx} height={H} />
          </clipPath>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={left - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--muted-foreground)">
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#weight-fill)" />
        <path d={line} fill="none" stroke="var(--foreground)" strokeWidth={2.5} strokeLinecap="round" />
        <path d={line} fill="none" stroke="var(--success)" strokeWidth={2.5} strokeLinecap="round" clipPath={`url(#${clipId})`} />

        <line x1={sx} x2={sx} y1={sy} y2={top + plotH} stroke="var(--success)" strokeWidth={1.5} />
        <circle cx={sx} cy={sy} r={5} fill="var(--card)" stroke="var(--success)" strokeWidth={2.5} />

        <g>
          <rect x={bubbleX} y={bubbleY} width={bubbleW} height={42} rx={11} fill="var(--foreground)" />
          <text x={bubbleX + bubbleW / 2} y={bubbleY + 18} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--background)">
            {selected.value} {unit}
          </text>
          <text x={bubbleX + bubbleW / 2} y={bubbleY + 33} textAnchor="middle" fontSize={10.5} fill="var(--background)" opacity={0.75}>
            {formatLongDate(selected.date)}
          </text>
        </g>

        {ticksX.map((t) => (
          <text key={t.date} x={left + t.position * plotW} y={H - 8} textAnchor={t.position < 0.06 ? "start" : t.position > 0.94 ? "end" : "middle"} fontSize={10.5} fill="var(--muted-foreground)">
            {t.label}
          </text>
        ))}
      </svg>
      <p className="sr-only" aria-live="polite">
        {selected.value} {unit} on {formatLongDate(selected.date)}
      </p>
    </>
  );
}

export interface EnergyDay {
  day: string;
  kcal: number;
  state: RingState;
}

export function EnergyBars({
  days,
  goal,
  summary,
}: {
  days: EnergyDay[];
  goal: number;
  summary: string;
}) {
  const H = 176;
  const top = 18;
  const bottom = 24;
  const plotH = H - top - bottom;
  const plotW = W - AXIS_W - RIGHT;

  const max = Math.max(goal, ...days.map((d) => d.kcal)) * 1.1;
  const y = (v: number) => top + (1 - v / max) * plotH;
  const slot = plotW / days.length;
  const barW = Math.min(30, slot * 0.58);
  // With many bars, label every few so the labels do not collide.
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));
  const showValues = days.length <= 10;

  const short = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
      <line x1={AXIS_W} x2={W - RIGHT} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />

      <line
        x1={AXIS_W}
        x2={W - RIGHT}
        y1={y(goal)}
        y2={y(goal)}
        stroke="var(--muted-foreground)"
        strokeWidth={1.2}
        strokeDasharray="4 4"
      />
      <text x={AXIS_W - 6} y={y(goal) + 3.5} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
        {short(goal)}
      </text>
      <text x={AXIS_W - 6} y={y(0) + 3.5} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
        0
      </text>

      {days.map((d, i) => {
        const cx = AXIS_W + slot * i + slot / 2;
        const empty = d.state === "empty";
        const h = empty ? 3 : Math.max(3, y(0) - y(d.kcal));
        const fill = d.state === "under" ? "var(--muted-foreground)" : RING_COLORS[d.state];
        return (
          <g key={`${d.day}-${i}`}>
            <rect
              x={cx - barW / 2}
              y={y(0) - h}
              width={barW}
              height={h}
              rx={Math.min(7, barW / 2)}
              fill={fill}
              opacity={empty ? 0.25 : 1}
            />
            {!empty && showValues ? (
              <text x={cx} y={y(0) - h - 5} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--foreground)">
                {formatNumber(d.kcal) === "0" ? "" : short(d.kcal)}
              </text>
            ) : null}
            {i % labelEvery === 0 ? (
              <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
                {d.day}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
