"use client";

import { ArrowRight, Check, CloudOff, Flag, Flame, Heart, Scale, Trophy, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/snapplate/empty-state";
import { EnergyBars, WeightChart } from "@/components/snapplate/charts";
import { MockBanner } from "@/components/snapplate/mock-banner";
import { Segmented } from "@/components/snapplate/segmented";
import { WeightSheet } from "@/components/snapplate/weight-sheet";
import { Button } from "@/components/ui/button";
import { useMeals, useProfile, useWeightLogs } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { goalProgress, rangeStart, type WeightRange } from "@/lib/chart";
import { HISTORY_DAYS } from "@/lib/constants";
import { formatNumber, formatWeight, weightUnit, weightValue } from "@/lib/format";
import { formatScore } from "@/lib/healthScore";
import { bmi, bmiCategory, type BmiCategory } from "@/lib/nutrition";
import { ringState } from "@/lib/rings";
import { currentStreak, longestStreak } from "@/lib/streak";
import { addDays, dateRange, formatLongDate, formatWeekday, weekdayIndex, type LogDate } from "@/lib/time";
import { averageHealthScore, groupByDate, sumMeals } from "@/lib/totals";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS: { value: WeightRange; label: string }[] = [
  { value: "90D", label: "90D" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
];

type Period = "7" | "14" | "30";
const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "7", label: "7D" },
  { value: "14", label: "14D" },
  { value: "30", label: "30D" },
];

const BMI_SEGMENTS: { category: BmiCategory; label: string; from: number; to: number; color: string }[] = [
  { category: "underweight", label: "Under", from: 15, to: 18.5, color: "var(--fat)" },
  { category: "normal", label: "Normal", from: 18.5, to: 25, color: "var(--success)" },
  { category: "overweight", label: "Over", from: 25, to: 30, color: "var(--warning)" },
  { category: "obese", label: "Obese", from: 30, to: 40, color: "var(--danger)" },
];
const BMI_MIN = 15;
const BMI_MAX = 40;
const BMI_LABELS: Record<BmiCategory, string> = {
  underweight: "Underweight",
  normal: "Healthy weight",
  overweight: "Overweight",
  obese: "Obese",
};

const CARD = "rounded-[20px] border border-border bg-card shadow-[0_1px_4px_rgba(30,26,36,0.06)]";

function Section({ title, aside, children, label }: { title: string; aside?: React.ReactNode; children: React.ReactNode; label?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 p-5", CARD)} aria-label={label ?? title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** "Your Weight", the goal bar, and a dark Log Weight button along the bottom of the card. */
function WeightCard({
  weightKg,
  goalKg,
  progress,
  units,
  onLog,
}: {
  weightKg: number | null;
  goalKg: number | null;
  progress: number | null;
  units: "metric" | "imperial";
  onLog: () => void;
}) {
  return (
    <section className={cn("flex flex-col overflow-hidden", CARD)} aria-label="Your weight">
      <div className="flex flex-1 flex-col items-center gap-2 px-3 pt-4 pb-3 text-center">
        <span className="text-sm">Your Weight</span>
        <span className="text-[27px] leading-8 font-bold tabular-nums">{weightKg === null ? "-" : formatWeight(weightKg, units)}</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-foreground transition-[width] duration-700" style={{ width: `${Math.max(4, (progress ?? 0) * 100)}%` }} />
        </div>
        <span className="text-sm text-muted-foreground">{goalKg === null ? "Maintaining" : `Goal ${formatWeight(goalKg, units)}`}</span>
      </div>
      <button
        type="button"
        onClick={onLog}
        className="flex h-11 items-center justify-between bg-primary px-4 text-sm font-medium text-primary-foreground active:opacity-90"
      >
        Log Weight
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </section>
  );
}

/** The streak with this week's check circles, Sunday to Saturday. */
function StreakCard({ streak, today, logged }: { streak: number; today: LogDate; logged: ReadonlySet<LogDate> }) {
  const sundayFirst = addDays(today, -((weekdayIndex(today) + 1) % 7));
  const week = Array.from({ length: 7 }, (_, i) => addDays(sundayFirst, i));
  return (
    <section className={cn("flex flex-col items-center gap-1 px-3 py-4", CARD)} aria-label="Day streak">
      <div className="relative flex size-14 items-center justify-center">
        <Flame className="size-14" style={{ color: "var(--warning)" }} fill="currentColor" strokeWidth={1.5} aria-hidden />
        <span className="absolute inset-x-0 bottom-1.5 text-center text-xl leading-none font-extrabold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">{streak}</span>
      </div>
      <span className="text-[1.05rem] font-semibold" style={{ color: "var(--carbs)" }}>
        Day Streak
      </span>
      <ul className="mt-1.5 flex gap-1.5" aria-label="This week">
        {week.map((date) => {
          const done = logged.has(date);
          return (
            <li key={date} className="flex flex-col items-center gap-1">
              <span className="text-[0.62rem] font-semibold text-muted-foreground">{formatWeekday(date).charAt(0)}</span>
              <span
                className={cn("flex size-[18px] items-center justify-center rounded-full", done ? "text-white" : "bg-muted")}
                style={done ? { background: "var(--carbs)" } : undefined}
              >
                {done ? <Check className="size-3" strokeWidth={3.5} aria-hidden /> : null}
              </span>
              <span className="sr-only">{done ? "logged" : "not logged"}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ProgressScreen() {
  const today = useToday();
  const [range, setRange] = useState<WeightRange>("6M");
  const [period, setPeriod] = useState<Period>("7");
  const [weighIn, setWeighIn] = useState(false);

  const from = today ? addDays(today, -(HISTORY_DAYS - 1)) : null;
  const profileQuery = useProfile();
  const weightsQuery = useWeightLogs();
  const mealsQuery = useMeals(from, today);

  const meals = mealsQuery.data;
  const byDate = useMemo(() => groupByDate(meals ?? []), [meals]);

  if (profileQuery.isError || weightsQuery.isError || mealsQuery.isError) {
    return (
      <div className="flex flex-col gap-4 pt-10">
        <EmptyState icon={CloudOff} title="Couldn't load your progress">
          Check your connection and try again.
        </EmptyState>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            void profileQuery.refetch();
            void weightsQuery.refetch();
            void mealsQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const profile = profileQuery.data;
  const weights = weightsQuery.data;
  if (!today || profileQuery.isPending || weightsQuery.isPending || mealsQuery.isPending || !weights) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
        <h1 className="text-[32px] leading-[37px] font-bold tracking-tight">Progress</h1>
        <div className="h-44 animate-pulse rounded-[20px] bg-muted" />
        <div className="h-72 animate-pulse rounded-[20px] bg-muted" />
      </div>
    );
  }

  const units = profile?.units ?? "metric";
  const unit = weightUnit(units);

  // --- weight --------------------------------------------------------------------------------
  const latest = weights[weights.length - 1];
  const start = weights[0];
  const goalKg = profile?.goal && profile.goal !== "maintain" ? (profile.goalWeightKg ?? null) : null;
  const progress = start && latest && goalKg !== null ? goalProgress(start.weightKg, latest.weightKg, goalKg) : null;
  const since = rangeStart(range, today);
  const shown = weights.filter((w) => since === null || w.logDate >= since);
  const weightPoints = shown.map((w) => ({ date: w.logDate, value: weightValue(w.weightKg, units) }));
  const trendingRight =
    shown.length > 1 && profile?.goal
      ? profile.goal === "lose"
        ? shown[shown.length - 1]!.weightKg <= shown[0]!.weightKg
        : profile.goal === "gain"
          ? shown[shown.length - 1]!.weightKg >= shown[0]!.weightKg
          : true
      : true;
  const cheer =
    progress !== null && progress >= 1
      ? "Goal reached! Time to set a new one."
      : trendingRight
        ? "Great job! Consistency is key, and it's showing."
        : "Progress isn't a straight line. Keep logging and stay consistent.";

  // --- BMI -----------------------------------------------------------------------------------
  const bmiValue = profile?.heightCm && latest ? bmi(latest.weightKg, profile.heightCm) : null;
  const category = bmiValue === null ? null : bmiCategory(bmiValue);
  const bmiPos = bmiValue === null ? 0 : ((Math.min(BMI_MAX, Math.max(BMI_MIN, bmiValue)) - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100;

  // --- calories ------------------------------------------------------------------------------
  const goal = profile?.calorieTarget ?? 2000;
  const days = Number(period);
  const recent = dateRange(addDays(today, -(days - 1)), today).map((date) => {
    const list = byDate.get(date) ?? [];
    const eaten = sumMeals(list).calories;
    return { day: formatWeekday(date), kcal: Math.round(eaten), state: ringState(eaten, goal, list.length > 0) };
  });
  const previous = dateRange(addDays(today, -(days * 2 - 1)), addDays(today, -days)).map((date) => {
    const list = byDate.get(date) ?? [];
    return list.length > 0 ? sumMeals(list).calories : null;
  });
  const loggedRecent = recent.filter((d) => d.state !== "empty");
  const loggedPrevious = previous.filter((v): v is number => v !== null);
  const average = loggedRecent.length ? loggedRecent.reduce((s, d) => s + d.kcal, 0) / loggedRecent.length : 0;
  const previousAverage = loggedPrevious.length ? loggedPrevious.reduce((s, v) => s + v, 0) / loggedPrevious.length : 0;
  const change = previousAverage > 0 && average > 0 ? ((average - previousAverage) / previousAverage) * 100 : null;
  const changeIsGood = change === null ? true : profile?.goal === "gain" ? change >= 0 : profile?.goal === "lose" ? change <= 0 : Math.abs(change) <= 10;
  const onTarget = recent.filter((d) => d.state === "on").length;

  // --- streaks and stats -----------------------------------------------------------------------
  const loggedDates = new Set(byDate.keys());
  const streak = currentStreak(loggedDates, today);
  const best = longestStreak(loggedDates);
  const last30 = (meals ?? []).filter((m) => m.logDate >= addDays(today, -29));
  const avgHealth = averageHealthScore(last30);

  return (
    <div className="flex flex-col gap-4">
      <MockBanner />
      <h1 className="text-[32px] leading-[37px] font-bold tracking-tight">Progress</h1>

      <div className="grid grid-cols-2 gap-3">
        <WeightCard weightKg={latest?.weightKg ?? null} goalKg={goalKg} progress={progress} units={units} onLog={() => setWeighIn(true)} />
        <StreakCard streak={streak} today={today} logged={loggedDates} />
      </div>

      <Section
        title="Weight Progress"
        aside={
          progress !== null ? (
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              <Flag className="size-3.5" aria-hidden />
              <span>
                <b>{Math.round(progress * 100)}%</b> <span className="text-muted-foreground">of goal</span>
              </span>
            </span>
          ) : null
        }
      >
        {weightPoints.length > 1 ? (
          <WeightChart
            points={weightPoints}
            unit={unit}
            summary={`Weight trend from ${weightPoints[0]!.value} ${unit} to ${weightPoints[weightPoints.length - 1]!.value} ${unit}.`}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {weights.length === 0 ? "Log your weight to start your chart." : "Log another weigh-in to see your trend."}
          </p>
        )}
        <Segmented
          label="Chart range"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          className="w-full [&_button]:min-w-0 [&_button]:flex-1"
        />
        {weightPoints.length > 1 ? (
          <p className="rounded-xl bg-success/12 px-3 py-2.5 text-center text-[0.8rem] font-semibold text-success">{cheer}</p>
        ) : null}
        {goalKg !== null && latest ? (
          <p className="text-center text-xs text-muted-foreground">
            {Math.abs(latest.weightKg - goalKg) < 0.05
              ? "You're at your goal weight."
              : `${formatWeight(Math.abs(latest.weightKg - goalKg), units)} to go to ${formatWeight(goalKg, units)}.`}
          </p>
        ) : null}
      </Section>

      <Section
        title="Daily Average Calories"
        aside={<Segmented label="Period" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} className="[&_button]:h-8 [&_button]:min-w-0 [&_button]:px-2.5 [&_button]:text-xs" />}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[34px] leading-9 font-bold tracking-tight tabular-nums">{formatNumber(average)}</span>
          <span className="text-muted-foreground">cal</span>
          {change !== null ? (
            <span className={cn("text-sm font-semibold", changeIsGood ? "text-success" : "text-warning")}>
              {change >= 0 ? "↑" : "↓"} {Math.abs(Math.round(change))}%
            </span>
          ) : null}
        </div>
        <EnergyBars days={recent} goal={goal} summary={`Calories for the last ${days} days, averaging ${formatNumber(average)} against a goal of ${formatNumber(goal)}.`} />
        <p className="text-xs text-muted-foreground">
          {onTarget} of {recent.length} days on target. The dashed line is your {formatNumber(goal)} kcal goal
          {change !== null ? `, and the change compares with the ${days} days before.` : "."}
        </p>
      </Section>

      {bmiValue !== null && category ? (
        <Section title="BMI" aside={<span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold">{BMI_LABELS[category]}</span>}>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums">{bmiValue.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">kg/m²</span>
          </div>
          <div className="flex flex-col gap-1.5" aria-hidden>
            <div className="relative flex h-2.5 gap-0.5 overflow-visible">
              {BMI_SEGMENTS.map((s) => (
                <span
                  key={s.category}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${((s.to - s.from) / (BMI_MAX - BMI_MIN)) * 100}%`, background: s.color, opacity: s.category === category ? 1 : 0.35 }}
                />
              ))}
              <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground" style={{ left: `${bmiPos}%` }} />
            </div>
            <div className="flex text-[0.65rem] text-muted-foreground">
              {BMI_SEGMENTS.map((s) => (
                <span key={s.category} style={{ width: `${((s.to - s.from) / (BMI_MAX - BMI_MIN)) * 100}%` }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            BMI is a rough guide. It can mislead for very muscular people, and it doesn&apos;t replace advice from a health professional.
          </p>
        </Section>
      ) : null}

      <section className="grid grid-cols-3 gap-2" aria-label="Highlights">
        {[
          { icon: Trophy, value: `${best}`, label: "Longest streak", color: "var(--carbs)" },
          { icon: UtensilsCrossed, value: `${last30.length}`, label: "Meals, 30 days", color: "var(--fat)" },
          { icon: Heart, value: avgHealth === null ? "-" : formatScore(avgHealth), label: "Avg health score", color: "var(--protein)" },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className={cn("flex flex-col gap-1 p-3.5", CARD)}>
            <Icon className="size-4" style={{ color }} aria-hidden />
            <span className="text-xl font-bold tabular-nums">{value}</span>
            <span className="text-[0.7rem] leading-tight text-muted-foreground">{label}</span>
          </div>
        ))}
      </section>

      {start ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Scale className="size-3.5" aria-hidden />
          Started at {formatWeight(start.weightKg, units)} on {formatLongDate(start.logDate)}
        </p>
      ) : null}

      <WeightSheet open={weighIn} onOpenChange={setWeighIn} />
    </div>
  );
}
