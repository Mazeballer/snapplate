"use client";

import { Flame, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A circular progress ring. `progress` runs from 0 to 1. It starts at its real value (no
 * draw-in on load) and animates when the value changes.
 */
export function Ring({
  size,
  stroke,
  progress,
  color,
  track = "var(--muted)",
  children,
}: {
  size: number;
  stroke: number;
  progress: number;
  color: string;
  track?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: clamped }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  );
}

/** The calories card: the number on the left, a black ring with a flame on the right. */
export function CalorieCard({
  value,
  label,
  note,
  progress,
  ringColor = "var(--foreground)",
  className,
}: {
  value: string;
  label: string;
  /** A small extra line under the label, e.g. calories rolled over from yesterday. */
  note?: string;
  progress: number;
  ringColor?: string;
  className?: string;
}) {
  return (
    <section
      aria-label={label}
      className={cn(
        "flex h-[140px] items-center justify-between rounded-[20px] border border-border bg-card px-6 shadow-[0_1px_4px_rgba(30,26,36,0.06)]",
        className,
      )}
    >
      <div className="flex flex-col">
        <span className="text-[40px] leading-[44px] font-bold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {note ? <span className="mt-1 text-[0.7rem] text-muted-foreground">{note}</span> : null}
      </div>
      <Ring size={100} stroke={8} progress={progress} color={ringColor}>
        <span className="flex size-[50px] items-center justify-center rounded-full bg-background">
          <Flame className="size-6" fill="currentColor" aria-hidden />
        </span>
      </Ring>
    </section>
  );
}

/** A macro card: grams and a label on top, a coloured ring with the macro's icon below. */
export function MacroRingCard({
  label,
  value,
  caption,
  progress,
  colorVar,
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  value: string;
  caption: string;
  progress: number;
  colorVar: string;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex flex-col gap-0.5">
        <span className="text-base leading-4 font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">
          {label} {caption}
        </span>
      </div>
      <div className="mt-auto flex justify-center">
        <Ring size={80} stroke={5} progress={progress} color={`var(${colorVar})`}>
          <span className="flex size-[30px] items-center justify-center rounded-full bg-background">
            <Icon className="size-[15px]" style={{ color: `var(${colorVar})` }} aria-hidden />
          </span>
        </Ring>
      </div>
    </>
  );
  const classes = cn(
    "flex h-[150px] min-w-0 flex-1 flex-col rounded-[18px] border border-border bg-card p-3 text-left shadow-[0_1px_4px_rgba(30,26,36,0.06)]",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(classes, "transition-transform active:scale-[0.98]")}>
      {body}
    </button>
  ) : (
    <div className={classes}>{body}</div>
  );
}
