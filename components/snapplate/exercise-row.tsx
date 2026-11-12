"use client";

import { Dumbbell, Flame, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteExercise } from "@/hooks/use-data";
import { formatNumber } from "@/lib/format";
import { formatClockTime } from "@/lib/time";
import type { Exercise } from "@/lib/types";

const INTENSITY = { low: "Low", medium: "Medium", high: "High" } as const;

/** One logged workout, with a delete button. */
export function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const remove = useDeleteExercise();
  const detail = [
    exercise.durationMin ? `${exercise.durationMin} min` : null,
    exercise.intensity ? INTENSITY[exercise.intensity] : null,
    formatClockTime(exercise.loggedAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-background">
        <Dumbbell className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums">
        <Flame className="size-4" style={{ color: "var(--warning)" }} aria-hidden />
        {formatNumber(exercise.calories)}
        <span className="text-xs font-normal text-muted-foreground">kcal</span>
      </span>
      <button
        type="button"
        aria-label={`Delete ${exercise.name}`}
        disabled={remove.isPending}
        onClick={() =>
          remove.mutate(exercise.id, {
            onSuccess: () => toast("Workout deleted"),
            onError: () => toast.error("Couldn't delete that. Please try again."),
          })
        }
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
      >
        <Trash2 className="size-[18px]" aria-hidden />
      </button>
    </div>
  );
}
