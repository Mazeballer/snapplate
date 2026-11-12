"use client";

import { PencilLine, Search, TextCursorInput, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LogPage } from "@/components/log/log-page";
import { ReviewMeal } from "@/components/log/review-meal";
import { useLogDate, useSaveMeal } from "@/components/log/use-log";
import { EmptyState } from "@/components/snapplate/empty-state";
import { Segmented } from "@/components/snapplate/segmented";
import { Button } from "@/components/ui/button";
import { useMeals, useSavedMeals } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { HISTORY_DAYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { defaultMealType, draftFromSaved, savedFromMeal } from "@/lib/meal";
import { addDays, minutesSinceMidnight } from "@/lib/time";
import type { MealDraft, SavedMealInput } from "@/lib/types";

type Tab = "all" | "mine";

interface Food extends SavedMealInput {
  key: string;
  saved: boolean;
}

function ActionTile({ href, icon: Icon, label }: { href: string; icon: typeof PencilLine; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-[92px] flex-1 flex-col items-center justify-center gap-1.5 rounded-[15px] border-[1.5px] border-input bg-card transition-transform active:scale-[0.98]"
    >
      <span className="flex size-[42px] items-center justify-center rounded-[13px] bg-background">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="text-[0.8rem] font-bold">{label}</span>
    </Link>
  );
}

/**
 * Find a food to log: search the foods you have eaten recently and your saved meals, or jump to
 * describing a meal or typing it in by hand.
 */
export function FoodsScreen() {
  const logDate = useLogDate();
  const date = useSearchParams().get("date");
  const query = date ? `?date=${date}` : "";
  const { save, saving } = useSaveMeal(logDate);

  const today = useToday();
  const from = today ? addDays(today, -(HISTORY_DAYS - 1)) : null;
  const meals = useMeals(from, today);
  const saved = useSavedMeals();

  const [text, setText] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [chosen, setChosen] = useState<{ draft: MealDraft; fromSaved: boolean } | null>(null);

  const foods = useMemo<Food[]>(() => {
    const mine: Food[] = (saved.data ?? []).map((s) => ({ ...s, key: `saved-${s.id}`, saved: true }));
    // Recent foods: the latest entry for each name, newest first.
    const seen = new Set(mine.map((f) => f.name.toLowerCase()));
    const recent: Food[] = [];
    for (const meal of [...(meals.data ?? [])].reverse()) {
      const name = meal.name.toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);
      recent.push({ ...savedFromMeal(meal), key: `meal-${meal.id}`, saved: false });
    }
    return tab === "mine" ? mine : [...mine, ...recent];
  }, [saved.data, meals.data, tab]);

  const shown = foods.filter((f) => f.name.toLowerCase().includes(text.trim().toLowerCase()));
  const loading = saved.isPending || meals.isPending;

  if (chosen) {
    return (
      <LogPage
        title="Log meal"
        onBack={() => setChosen(null)}
        footer={
          <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={saving} onClick={() => void save(chosen.draft, { favourite: false })}>
            {saving ? "Saving…" : "Add meal"}
          </Button>
        }
      >
        <ReviewMeal
          draft={chosen.draft}
          onChange={(draft) => setChosen({ ...chosen, draft })}
          favourite={false}
          onFavouriteChange={() => undefined}
          showFavourite={false}
        />
      </LogPage>
    );
  }

  return (
    <LogPage title="Food Database">
      <label className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-4 focus-within:border-foreground">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 80))}
          placeholder="Search your foods"
          aria-label="Search your foods"
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
        />
      </label>

      <div className="flex gap-2">
        <ActionTile href={`/log/describe${query}`} icon={TextCursorInput} label="Describe" />
        <ActionTile href={`/log/manual${query}`} icon={PencilLine} label="Manual Add" />
      </div>

      <div className="flex justify-center">
        <Segmented
          label="Foods"
          options={[
            { value: "all", label: "All" },
            { value: "mine", label: "My meals" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title={text ? "No matches" : "Nothing here yet"}>
          {text ? "Try a different word, or describe the meal instead." : "Foods you log will show up here for quick re-logging."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((food) => (
            <li key={food.key}>
              <button
                type="button"
                onClick={() => setChosen({ draft: draftFromSaved(food, defaultMealType(minutesSinceMidnight())), fromSaved: food.saved })}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:bg-muted"
              >
                <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-background text-3xl">
                  {food.emoji ?? "🍽️"}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{food.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatNumber(food.calories)} kcal · P {Math.round(food.proteinG)}g · C {Math.round(food.carbsG)}g · F {Math.round(food.fatG)}g
                  </span>
                </span>
                {food.saved ? <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">Saved</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </LogPage>
  );
}
