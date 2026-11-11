import { RING_COLORS } from "@/components/snapplate/ring-colors";
import { formatNumber } from "@/lib/format";
import type { RingState } from "@/lib/rings";

/**
 * Two small SVG charts drawn by hand: a weight trend and a week of calories. They scale to the
 * width of their card (the viewBox keeps the proportions) and need no chart library.
 */

const W = 340;
const AXIS_W = 34; // room on the left for the y-axis labels
const RIGHT = 6;

function niceTicks(min: number, max: number, count: number): number[] {
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
}

export interface WeightPoint {
  label: string;
  value: number;
}

export function WeightChart({
  points,
  goal,
  unit,
  summary,
}: {
  points: WeightPoint[];
  goal: number | null;
  unit: string;
  /** Read out by screen readers in place of the picture. */
  summary: string;
}) {
  const H = 196;
  const top = 10;
  const bottom = 26;
  const plotH = H - top - bottom;
  const plotW = W - AXIS_W - RIGHT;

  const values = points.map((p) => p.value);
  const lows = goal !== null ? [...values, goal] : values;
  const yMin = Math.floor(Math.min(...lows) - 0.5);
  // Whole-number gridlines in three equal steps, so the axis labels are evenly spaced.
  const step = Math.max(1, Math.ceil((Math.ceil(Math.max(...lows) + 0.5) - yMin) / 3));
  const yMax = yMin + step * 3;
  const span = yMax - yMin;

  const x = (i: number) => AXIS_W + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => top + (1 - (v - yMin) / span) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${top + plotH} L${x(0).toFixed(1)},${top + plotH} Z`;

  const ticks = niceTicks(yMin, yMax, 4);
  const labelIdx = Array.from(new Set([0, Math.round((points.length - 1) / 3), Math.round(((points.length - 1) * 2) / 3), points.length - 1]));
  const last = points[points.length - 1]!;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
      <defs>
        <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={AXIS_W} x2={W - RIGHT} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
          <text x={AXIS_W - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
            {Math.round(t)}
          </text>
        </g>
      ))}

      {goal !== null ? (
        <g>
          <line
            x1={AXIS_W}
            x2={W - RIGHT}
            y1={y(goal)}
            y2={y(goal)}
            stroke="var(--muted-foreground)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
          <text x={W - RIGHT} y={y(goal) - 5} textAnchor="end" fontSize={10} fill="var(--muted-foreground)">
            Goal {goal} {unit}
          </text>
        </g>
      ) : null}

      <path d={area} fill="url(#weight-fill)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(points.length - 1)} cy={y(last.value)} r={4.5} fill="var(--brand)" stroke="var(--background)" strokeWidth={2} />

      {labelIdx.map((i, n) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          fontSize={10}
          fill="var(--muted-foreground)"
          textAnchor={n === 0 ? "start" : n === labelIdx.length - 1 ? "end" : "middle"}
        >
          {points[i]!.label}
        </text>
      ))}
    </svg>
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
            {!empty ? (
              <text x={cx} y={y(0) - h - 5} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="var(--foreground)">
                {formatNumber(d.kcal) === "0" ? "" : short(d.kcal)}
              </text>
            ) : null}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
              {d.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
