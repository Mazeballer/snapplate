"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { RING_COLORS } from "@/components/snapplate/ring-colors";
import { ringProgress, type RingState } from "@/lib/rings";
import { formatWeekday, parseLogDate, type LogDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface DaySummary {
  state: RingState;
  eaten: number;
  goal: number;
}

const SIZE = 34;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DayRing({ summary }: { summary: DaySummary }) {
  const { state } = summary;
  const progress = state === "empty" ? 0 : ringProgress(summary.eaten, summary.goal);
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="absolute top-0 left-0 -rotate-90"
      aria-hidden
    >
      {state === "empty" ? (
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.5}
          strokeWidth={2}
          strokeDasharray="1.5 4.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={state === "under" ? "var(--muted-foreground)" : RING_COLORS[state]}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </>
      )}
    </svg>
  );
}

/** Monday to Sunday strip. Each day's ring shows how close that day was to the calorie goal. */
export function WeekStrip({
  dates,
  selected,
  today,
  summaryFor,
  onSelect,
  onPrevWeek,
  onNextWeek,
  canGoPrev,
  canGoNext,
}: {
  dates: LogDate[];
  selected: LogDate;
  today: LogDate;
  summaryFor: (date: LogDate) => DaySummary;
  onSelect: (date: LogDate) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onPrevWeek}
        disabled={!canGoPrev}
        aria-label="Previous week"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors enabled:active:bg-muted disabled:opacity-30"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <ul className="grid min-w-0 flex-1 grid-cols-7 gap-0.5">
        {dates.map((date) => {
          const future = date > today;
          const isSelected = date === selected;
          const isToday = date === today;
          return (
            <li key={date} className="flex justify-center">
              <button
                type="button"
                disabled={future}
                onClick={() => onSelect(date)}
                aria-pressed={isSelected}
                aria-label={`${formatWeekday(date)} ${parseLogDate(date).day}${isToday ? ", today" : ""}`}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 transition-opacity",
                  future && "opacity-35",
                )}
              >
                <span
                  className={cn(
                    "text-[0.68rem] font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {formatWeekday(date)}
                </span>
                <span className="relative block shrink-0" style={{ width: SIZE, height: SIZE }}>
                  <DayRing summary={summaryFor(date)} />
                  <span
                    className={cn(
                      "absolute inset-1 flex items-center justify-center rounded-full text-[0.8rem] leading-none font-semibold tabular-nums",
                      isSelected && "bg-foreground text-background",
                      !isSelected && isToday && "text-brand",
                    )}
                  >
                    {parseLogDate(date).day}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onNextWeek}
        disabled={!canGoNext}
        aria-label="Next week"
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors enabled:active:bg-muted disabled:opacity-30"
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
