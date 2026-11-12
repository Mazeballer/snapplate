"use client";

import { Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LogPage } from "@/components/log/log-page";
import { ReviewMeal } from "@/components/log/review-meal";
import { useLogDate, useSaveMeal } from "@/components/log/use-log";
import { EmptyState } from "@/components/snapplate/empty-state";
import { Button } from "@/components/ui/button";
import { useDeleteSavedMeal, useSavedMeals } from "@/hooks/use-data";
import { formatNumber } from "@/lib/format";
import { defaultMealType, draftFromSaved } from "@/lib/meal";
import { minutesSinceMidnight } from "@/lib/time";
import type { MealDraft } from "@/lib/types";

export function SavedScreen() {
  const logDate = useLogDate();
  const { save, saving } = useSaveMeal(logDate);
  const { data: saved, isPending, isError } = useSavedMeals();
  const remove = useDeleteSavedMeal();
  const [draft, setDraft] = useState<MealDraft | null>(null);

  if (draft) {
    return (
      <LogPage
        title="Log meal"
        onBack={() => setDraft(null)}
        footer={
          <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={saving} onClick={() => void save(draft, { favourite: false })}>
            {saving ? "Saving…" : "Add meal"}
          </Button>
        }
      >
        <ReviewMeal draft={draft} onChange={setDraft} favourite={false} onFavouriteChange={() => undefined} showFavourite={false} />
      </LogPage>
    );
  }

  return (
    <LogPage title="Saved meals">
      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState icon={Bookmark} title="Couldn't load your saved meals">
          Check your connection and try again.
        </EmptyState>
      ) : saved.length === 0 ? (
        <EmptyState icon={Bookmark} title="No saved meals yet">
          Turn on “Save to my meals” when you add a meal, and it will show up here.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {saved.map((meal) => (
            <li key={meal.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card pr-2">
              <button
                type="button"
                onClick={() => setDraft(draftFromSaved(meal, defaultMealType(minutesSinceMidnight())))}
                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left active:bg-muted"
              >
                <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background text-3xl">
                  {meal.emoji ?? "🍽️"}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold">{meal.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(meal.calories)} kcal · P {Math.round(meal.proteinG)}g · C {Math.round(meal.carbsG)}g · F {Math.round(meal.fatG)}g
                  </span>
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${meal.name} from saved meals`}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(meal.id, {
                    onSuccess: () => toast("Removed from saved meals"),
                    onError: () => toast.error("Couldn't remove it. Please try again."),
                  })
                }
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
              >
                <Trash2 className="size-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </LogPage>
  );
}
