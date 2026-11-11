import { HealthChip } from "@/components/snapplate/health-chip";
import { formatNumber } from "@/lib/format";
import { formatClockTime } from "@/lib/time";
import type { Meal } from "@/lib/types";

const TYPE_LABEL = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
} as const;

export function MealThumb({ meal, className }: { meal: Meal; className?: string }) {
  return (
    <span
      aria-hidden
      className={
        className ??
        "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background text-3xl"
      }
    >
      {meal.emoji ?? "🍽️"}
    </span>
  );
}

/** One logged meal in the day's list. Tap to open its details. */
export function MealRow({ meal, onOpen }: { meal: Meal; onOpen: (meal: Meal) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(meal)}
      className="flex w-full items-center gap-3 rounded-2xl bg-muted/60 p-3 text-left transition-colors active:bg-muted"
    >
      <MealThumb meal={meal} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-semibold leading-tight">{meal.name}</span>
        <span className="text-xs text-muted-foreground">
          {meal.mealType ? `${TYPE_LABEL[meal.mealType]} · ` : ""}
          {formatClockTime(meal.loggedAt)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          P {Math.round(meal.proteinG)}g · C {Math.round(meal.carbsG)}g · F {Math.round(meal.fatG)}g
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="font-semibold tabular-nums">
          {formatNumber(meal.calories)}
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">kcal</span>
        </span>
        {meal.healthScore !== null ? <HealthChip score={meal.healthScore} /> : null}
      </span>
    </button>
  );
}
