"use client";

import { Beef, CloudOff, Droplet, UserRound, UtensilsCrossed, Wheat } from "lucide-react";
import { useMemo, useState } from "react";
import { ActivityCard } from "@/components/snapplate/activity-card";
import { CalorieRing } from "@/components/snapplate/calorie-ring";
import { EmptyState } from "@/components/snapplate/empty-state";
import { HealthChip } from "@/components/snapplate/health-chip";
import { MacroCard } from "@/components/snapplate/macro-card";
import { MealDetailDrawer } from "@/components/snapplate/meal-detail-drawer";
import { MealRow } from "@/components/snapplate/meal-row";
import { MockBanner } from "@/components/snapplate/mock-banner";
import { StreakChip } from "@/components/snapplate/streak-chip";
import { WaterCard } from "@/components/snapplate/water-card";
import { WeekStrip, type DaySummary } from "@/components/snapplate/week-strip";
import { Button } from "@/components/ui/button";
import { useActivity, useMeals, useProfile, useWater } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { HISTORY_DAYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { ringState } from "@/lib/rings";
import { currentStreak } from "@/lib/streak";
import { addDays, formatDate, formatDayLabel, startOfWeek, weekDates, type LogDate } from "@/lib/time";
import { averageHealthScore, groupByDate, sumMeals } from "@/lib/totals";
import type { Meal } from "@/lib/types";

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="h-12 w-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 animate-pulse rounded-2xl bg-muted" />
      <div className="mx-auto size-[232px] animate-pulse rounded-full bg-muted" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 flex-1 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const today = useToday();
  const [picked, setPicked] = useState<LogDate | null>(null);
  const [detail, setDetail] = useState<{ meal: Meal; open: boolean } | null>(null);

  const from = today ? addDays(today, -(HISTORY_DAYS - 1)) : null;
  const profileQuery = useProfile();
  const mealsQuery = useMeals(from, today);
  const waterQuery = useWater(from, today);
  const activityQuery = useActivity(from, today);

  const meals = mealsQuery.data;
  const byDate = useMemo(() => groupByDate(meals ?? []), [meals]);
  const streak = useMemo(
    () => (today ? currentStreak(byDate.keys(), today) : 0),
    [byDate, today],
  );

  if (profileQuery.isError || mealsQuery.isError) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <EmptyState icon={CloudOff} title="Couldn't load your log">
          Check your connection and try again.
        </EmptyState>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            void profileQuery.refetch();
            void mealsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!today || from === null || profileQuery.isPending || mealsQuery.isPending) {
    return <HomeSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <EmptyState icon={UserRound} title="Let's set up your plan">
          Your profile isn&apos;t set up yet. The guided setup is coming soon.
        </EmptyState>
      </div>
    );
  }

  const date = picked ?? today;
  const dayMeals = byDate.get(date) ?? [];
  const totals = sumMeals(dayMeals);
  const activity = activityQuery.data?.find((a) => a.logDate === date);
  const burned = profile.addBurnedCalories ? (activity?.activeKcal ?? 0) : 0;
  const goal = profile.calorieTarget + burned;
  const avgHealth = averageHealthScore(dayMeals);
  const waterMl = waterQuery.data?.[date] ?? 0;
  const week = weekDates(date);

  const summaryFor = (d: LogDate): DaySummary => {
    const list = byDate.get(d) ?? [];
    const eaten = sumMeals(list).calories;
    return { state: ringState(eaten, profile.calorieTarget, list.length > 0), eaten, goal: profile.calorieTarget };
  };

  return (
    <div className="flex flex-col gap-5">
      <MockBanner />

      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight">{formatDayLabel(date, today)}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
        </div>
        <StreakChip days={streak} />
      </header>

      <WeekStrip
        dates={week}
        selected={date}
        today={today}
        summaryFor={summaryFor}
        onSelect={setPicked}
        onPrevWeek={() => setPicked(addDays(date, -7))}
        onNextWeek={() => {
          const next = addDays(date, 7);
          setPicked(next > today ? today : next);
        }}
        canGoPrev={addDays(startOfWeek(date), -1) >= from}
        canGoNext={addDays(startOfWeek(date), 7) <= today}
      />

      <section className="flex flex-col gap-5 rounded-3xl bg-muted/60 p-5" aria-label="Calories">
        <CalorieRing eaten={totals.calories} goal={goal} hasLogs={dayMeals.length > 0} />
        <dl className="grid grid-cols-3 text-center">
          <div>
            <dd className="text-lg font-semibold tabular-nums">{formatNumber(totals.calories)}</dd>
            <dt className="text-xs text-muted-foreground">Eaten</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold tabular-nums">{formatNumber(goal)}</dd>
            <dt className="text-xs text-muted-foreground">Goal</dt>
          </div>
          <div>
            <dd className="text-lg font-semibold tabular-nums">{formatNumber(activity?.activeKcal ?? 0)}</dd>
            <dt className="text-xs text-muted-foreground">Burned</dt>
          </div>
        </dl>
      </section>

      <section className="flex gap-2" aria-label="Macros">
        <MacroCard label="Protein" icon={Beef} eaten={totals.proteinG} goal={profile.proteinG} colorVar="--protein" />
        <MacroCard label="Carbs" icon={Wheat} eaten={totals.carbsG} goal={profile.carbsG} colorVar="--carbs" />
        <MacroCard label="Fat" icon={Droplet} eaten={totals.fatG} goal={profile.fatG} colorVar="--fat" />
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Activity and water">
        <ActivityCard
          steps={activity?.steps ?? 0}
          activeKcal={activity?.activeKcal ?? 0}
          stepGoal={profile.stepGoal}
          hasData={activity !== undefined}
        />
        <WaterCard ml={waterMl} canAdd={date === today} />
      </section>

      <section className="flex flex-col gap-3" aria-label="Meals">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Meals</h2>
          {avgHealth !== null ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Avg health <HealthChip score={avgHealth} />
            </span>
          ) : null}
        </div>
        {dayMeals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {dayMeals.map((meal) => (
              <li key={meal.id}>
                <MealRow meal={meal} onOpen={(m) => setDetail({ meal: m, open: true })} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={UtensilsCrossed} title="Nothing logged">
            {date === today ? "Tap the + button to snap your first meal." : "No meals were logged on this day."}
          </EmptyState>
        )}
      </section>

      <MealDetailDrawer
        meal={detail?.meal ?? null}
        open={detail?.open ?? false}
        onOpenChange={(open) => setDetail((d) => (d ? { ...d, open } : d))}
      />
    </div>
  );
}
