"use client";

import { CloudOff, Flame, Heart, Scale, Trophy, UtensilsCrossed } from "lucide-react";
import { useMemo, useState } from "react";
import { EnergyBars, WeightChart } from "@/components/snapplate/charts";
import { EmptyState } from "@/components/snapplate/empty-state";
import { MockBanner } from "@/components/snapplate/mock-banner";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMeals, useProfile, useWeightLogs } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { HISTORY_DAYS } from "@/lib/constants";
import { formatNumber, formatWeight, formatWeightChange, weightUnit, weightValue } from "@/lib/format";
import { formatScore } from "@/lib/healthScore";
import { bmi, bmiCategory, projectGoalDate, type BmiCategory } from "@/lib/nutrition";
import { ringState } from "@/lib/rings";
import { currentStreak, longestStreak } from "@/lib/streak";
import { addDays, dateRange, formatLongDate, formatShortDate, formatWeekday } from "@/lib/time";
import { averageHealthScore, groupByDate, sumMeals } from "@/lib/totals";
import { cn } from "@/lib/utils";

type Range = "30" | "90" | "all";
const RANGE_LABELS: Record<Range, string> = { "30": "30D", "90": "90D", all: "All" };

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

function Card({
  title,
  icon: Icon,
  children,
  aside,
}: {
  title: string;
  icon: typeof Scale;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-muted/60 p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Scale;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-muted/60 p-4">
      <Icon className="size-4" style={{ color }} aria-hidden />
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ProgressScreen() {
  const today = useToday();
  const [range, setRange] = useState<Range>("90");

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
      <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  const units = profile?.units ?? "metric";
  const unit = weightUnit(units);

  // --- weight -------------------------------------------------------------------------
  const rangeStart = range === "all" ? "0000-01-01" : addDays(today, -Number(range));
  const shown = weights.filter((w) => w.logDate >= rangeStart);
  const latest = weights[weights.length - 1];
  const first = shown[0];
  const change = latest && first ? latest.weightKg - first.weightKg : 0;
  const goalKg = profile?.goalWeightKg ?? null;
  const wantsLoss = profile?.goal === "lose";
  const movingRight = profile?.goal === "maintain" || (wantsLoss ? change <= 0 : change >= 0);
  const projection =
    profile && latest && goalKg !== null && profile.goal && profile.paceKgPerWeek
      ? projectGoalDate(profile.goal, latest.weightKg, goalKg, profile.paceKgPerWeek, today)
      : null;

  const weightPoints = shown.map((w) => ({
    label: formatShortDate(w.logDate),
    value: weightValue(w.weightKg, units),
  }));
  const goalValue = goalKg !== null ? weightValue(goalKg, units) : null;

  // --- BMI ----------------------------------------------------------------------------
  const bmiValue = profile?.heightCm && latest ? bmi(latest.weightKg, profile.heightCm) : null;
  const bmiPos =
    bmiValue === null
      ? 0
      : ((Math.min(BMI_MAX, Math.max(BMI_MIN, bmiValue)) - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100;
  const category = bmiValue === null ? null : bmiCategory(bmiValue);

  // --- energy (last 7 days) ------------------------------------------------------------
  const goal = profile?.calorieTarget ?? 2000;
  const week = dateRange(addDays(today, -6), today).map((date) => {
    const list = byDate.get(date) ?? [];
    const eaten = sumMeals(list).calories;
    return {
      day: formatWeekday(date),
      kcal: Math.round(eaten),
      state: ringState(eaten, goal, list.length > 0),
    };
  });
  const logged = week.filter((d) => d.state !== "empty");
  const average = logged.length ? logged.reduce((sum, d) => sum + d.kcal, 0) / logged.length : 0;
  const onTarget = week.filter((d) => d.state === "on").length;

  // --- stats ---------------------------------------------------------------------------
  const last30 = (meals ?? []).filter((m) => m.logDate >= addDays(today, -29));
  const avgHealth = averageHealthScore(last30);
  const streak = currentStreak(byDate.keys(), today);
  const best = longestStreak(byDate.keys());

  return (
    <div className="flex flex-col gap-5">
      <MockBanner />
      <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>

      <section className="grid grid-cols-2 gap-3" aria-label="Highlights">
        <StatTile icon={Flame} value={`${streak}`} label="Day streak" color="var(--warning)" />
        <StatTile icon={Trophy} value={`${best}`} label="Longest streak" color="var(--brand)" />
        <StatTile icon={UtensilsCrossed} value={`${last30.length}`} label="Meals, last 30 days" color="var(--fat)" />
        <StatTile
          icon={Heart}
          value={avgHealth === null ? "-" : formatScore(avgHealth)}
          label="Avg health score"
          color="var(--danger)"
        />
      </section>

      <Card
        title="Weight"
        icon={Scale}
        aside={
          <ToggleGroup
            value={[range]}
            onValueChange={(next) => {
              const choice = next[0] as Range | undefined;
              if (choice) setRange(choice);
            }}
            variant="outline"
            spacing={0}
            aria-label="Chart range"
          >
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <ToggleGroupItem key={r} value={r} className="h-8 px-3 text-xs">
                {RANGE_LABELS[r]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      >
        {latest ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="leading-tight">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {weightValue(latest.weightKg, units)}
                </span>
                <span className="ml-1 text-muted-foreground">{unit}</span>
                <span className="block text-xs text-muted-foreground">
                  Weighed in {formatShortDate(latest.logDate)}
                </span>
              </div>
              {first && shown.length > 1 ? (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums",
                    movingRight ? "bg-success/15 text-success" : "bg-warning/20 text-foreground",
                  )}
                >
                  {formatWeightChange(change, units)}
                </span>
              ) : null}
            </div>

            {weightPoints.length > 1 ? (
              <WeightChart
                points={weightPoints}
                goal={goalValue}
                unit={unit}
                summary={`Weight trend: ${weightPoints[0]!.value} ${unit} on ${weightPoints[0]!.label}, now ${weightPoints[weightPoints.length - 1]!.value} ${unit}.`}
              />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Log another weigh-in to see your trend.
              </p>
            )}

            {goalKg !== null ? (
              <p className="text-sm text-muted-foreground">
                Goal <span className="font-semibold text-foreground">{formatWeight(goalKg, units)}</span>
                {" · "}
                {Math.abs(latest.weightKg - goalKg) < 0.05
                  ? "you're there"
                  : `${formatWeight(Math.abs(latest.weightKg - goalKg), units)} to go`}
                {projection ? (
                  <>
                    {" · on track for "}
                    <span className="font-semibold text-foreground">{formatLongDate(projection.date)}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </>
        ) : (
          <EmptyState icon={Scale} title="No weigh-ins yet">
            Log your weight to start your chart.
          </EmptyState>
        )}
      </Card>

      {bmiValue !== null && category ? (
        <Card
          title="BMI"
          icon={Scale}
          aside={
            <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold">
              {BMI_LABELS[category]}
            </span>
          }
        >
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{bmiValue.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">kg/m²</span>
          </div>
          <div className="flex flex-col gap-1.5" aria-hidden>
            <div className="relative flex h-2.5 gap-0.5 overflow-visible">
              {BMI_SEGMENTS.map((s) => (
                <span
                  key={s.category}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${((s.to - s.from) / (BMI_MAX - BMI_MIN)) * 100}%`,
                    background: s.color,
                    opacity: s.category === category ? 1 : 0.35,
                  }}
                />
              ))}
              <span
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground"
                style={{ left: `${bmiPos}%` }}
              />
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
            BMI is a rough guide. It can mislead for very muscular people, and it doesn&apos;t replace advice from a
            health professional.
          </p>
        </Card>
      ) : null}

      <Card title="Last 7 days" icon={Flame}>
        <div className="flex items-baseline justify-between gap-3">
          <div className="leading-tight">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">{formatNumber(average)}</span>
            <span className="ml-1 text-muted-foreground">kcal / day</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {onTarget} of {week.length} on target
          </span>
        </div>
        <EnergyBars
          days={week}
          goal={goal}
          summary={`Calories for the last 7 days, averaging ${formatNumber(average)} against a goal of ${formatNumber(goal)}.`}
        />
        <p className="text-xs text-muted-foreground">
          The dashed line is your {formatNumber(goal)} kcal goal. Green bars are within 100 kcal of it.
        </p>
      </Card>
    </div>
  );
}
