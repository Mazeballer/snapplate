"use client";

import { Beef, CloudOff, Droplet, UserRound, UtensilsCrossed, Wheat } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActivityCard } from "@/components/snapplate/activity-card";
import { EmptyState } from "@/components/snapplate/empty-state";
import { HealthChip } from "@/components/snapplate/health-chip";
import { MealDetailDrawer } from "@/components/snapplate/meal-detail-drawer";
import { MealRow } from "@/components/snapplate/meal-row";
import { MockBanner } from "@/components/snapplate/mock-banner";
import { CalorieCard, MacroRingCard } from "@/components/snapplate/ring-cards";
import { StreakChip } from "@/components/snapplate/streak-chip";
import { WaterCard } from "@/components/snapplate/water-card";
import { WeekStrip, type DaySummary } from "@/components/snapplate/week-strip";
import { Button } from "@/components/ui/button";
import { useActivity, useMeals, useProfile, useWater } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { HISTORY_DAYS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { ringProgress, ringState } from "@/lib/rings";
import { currentStreak } from "@/lib/streak";
import { addDays, formatDate, startOfWeek, weekDates, type LogDate } from "@/lib/time";
import { averageHealthScore, groupByDate, rolloverAmount, sumMeals } from "@/lib/totals";
import type { Meal } from "@/lib/types";

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 animate-pulse rounded-2xl bg-muted" />
      <div className="h-[140px] animate-pulse rounded-[20px] bg-muted" />
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[150px] flex-1 animate-pulse rounded-[18px] bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const router = useRouter();
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
  const streak = useMemo(() => (today ? currentStreak(byDate.keys(), today) : 0), [byDate, today]);

  // A new account has no profile yet: send it to the setup flow.
  const needsSetup =
    !profileQuery.isPending && !profileQuery.isError && (!profileQuery.data || !profileQuery.data.onboarded);
  useEffect(() => {
    if (needsSetup) router.replace("/onboarding");
  }, [needsSetup, router]);

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
  if (!today || from === null || profileQuery.isPending || mealsQuery.isPending || needsSetup) {
    return <HomeSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <EmptyState icon={UserRound} title="Let's set up your plan">
          Taking you to the setup…
        </EmptyState>
      </div>
    );
  }

  const date = picked ?? today;
  const dayMeals = byDate.get(date) ?? [];
  const totals = sumMeals(dayMeals);
  const activity = activityQuery.data?.find((a) => a.logDate === date);
  const burned = profile.addBurnedCalories ? (activity?.activeKcal ?? 0) : 0;

  let rollover = 0;
  if (profile.rolloverCalories) {
    const previous = byDate.get(addDays(date, -1)) ?? [];
    rollover = rolloverAmount(profile.calorieTarget, sumMeals(previous).calories, previous.length > 0);
  }

  const goal = profile.calorieTarget + burned + rollover;
  const remaining = goal - totals.calories;
  const state = ringState(totals.calories, goal, dayMeals.length > 0);
  const ringColor = state === "over" ? "var(--danger)" : state === "slightly_over" ? "var(--warning)" : "var(--foreground)";
  const avgHealth = averageHealthScore(dayMeals);
  const waterMl = waterQuery.data?.[date] ?? 0;
  const week = weekDates(date);
  const extras = [burned > 0 ? `+${formatNumber(burned)} burned` : null, rollover > 0 ? `+${formatNumber(rollover)} rolled over` : null]
    .filter(Boolean)
    .join(" · ");

  const summaryFor = (d: LogDate): DaySummary => {
    const list = byDate.get(d) ?? [];
    const eaten = sumMeals(list).calories;
    return { state: ringState(eaten, profile.calorieTarget, list.length > 0), eaten, goal: profile.calorieTarget };
  };

  const macro = (eaten: number, target: number) => ({
    value: `${formatNumber(Math.abs(target - eaten))}g`,
    caption: target - eaten < 0 ? "over" : "left",
    progress: ringProgress(eaten, target),
  });
  const protein = macro(totals.proteinG, profile.proteinG);
  const carbs = macro(totals.carbsG, profile.carbsG);
  const fat = macro(totals.fatG, profile.fatG);

  return (
    <div className="flex flex-col gap-4">
      <MockBanner />

      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" width={34} height={34} priority className="rounded-[10px]" />
          <span className="text-2xl font-bold tracking-tight">Snapplate</span>
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

      <CalorieCard
        value={formatNumber(Math.abs(remaining))}
        label={remaining < 0 ? "Calories over" : "Calories left"}
        note={extras || undefined}
        progress={ringProgress(totals.calories, goal)}
        ringColor={ringColor}
      />

      <section className="flex gap-2" aria-label="Macros">
        <MacroRingCard label="Protein" icon={Beef} colorVar="--protein" {...protein} />
        <MacroRingCard label="Carbs" icon={Wheat} colorVar="--carbs" {...carbs} />
        <MacroRingCard label="Fat" icon={Droplet} colorVar="--fat" {...fat} />
      </section>

      <section className="grid grid-cols-2 gap-2" aria-label="Activity and water">
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
          <h2 className="text-lg font-bold">{date === today ? "Recently logged" : `Logged ${formatDate(date)}`}</h2>
          {avgHealth !== null ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Avg health <HealthChip score={avgHealth} />
            </span>
          ) : null}
        </div>
        {dayMeals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {[...dayMeals].reverse().map((meal) => (
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
