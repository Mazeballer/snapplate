"use client";

import { motion } from "motion/react";
import { formatNumber } from "@/lib/format";
import { ringProgress, ringState, type RingState } from "@/lib/rings";

const SIZE = 232;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;

export const RING_COLORS: Record<RingState, string> = {
  empty: "var(--muted-foreground)",
  under: "var(--brand)",
  on: "var(--success)",
  slightly_over: "var(--warning)",
  over: "var(--danger)",
};

/** The big calories-left ring on the home screen. */
export function CalorieRing({
  eaten,
  goal,
  hasLogs,
}: {
  eaten: number;
  goal: number;
  hasLogs: boolean;
}) {
  const remaining = goal - eaten;
  const over = remaining < 0;
  const state = ringState(eaten, goal, hasLogs);
  const progress = ringProgress(eaten, goal);

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="img"
      aria-label={
        over
          ? `${formatNumber(-remaining)} calories over your goal of ${formatNumber(goal)}`
          : `${formatNumber(remaining)} calories left of your goal of ${formatNumber(goal)}`
      }
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={RING_COLORS[state === "empty" ? "under" : state]}
          strokeWidth={STROKE}
          strokeLinecap="round"
          // Show the true value straight away; only changes (e.g. picking another day) animate.
          initial={false}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">
          {formatNumber(Math.abs(remaining))}
        </span>
        <span className="text-sm text-muted-foreground">
          {over ? "calories over" : "calories left"}
        </span>
      </div>
    </div>
  );
}
