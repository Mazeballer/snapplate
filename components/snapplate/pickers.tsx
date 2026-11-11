"use client";

import {
  Beef,
  Cat,
  Droplet,
  Dumbbell,
  Equal,
  Footprints,
  Leaf,
  Rabbit,
  Scale,
  Snail,
  TrendingDown,
  TrendingUp,
  Trophy,
  TriangleAlert,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { ChoiceCard } from "@/components/snapplate/choice-card";
import { numberItems, WheelPicker, type WheelItem } from "@/components/snapplate/wheel-picker";
import { Slider } from "@/components/ui/slider";
import { formatWeight } from "@/lib/format";
import {
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  paceLevel,
  projectGoalDate,
  round1,
  type ActivityLevel,
  type DietPlan,
  type Goal,
  type PaceLevel,
  type Sex,
} from "@/lib/nutrition";
import { MIN_AGE } from "@/lib/onboarding";
import { goalWeightRange } from "@/lib/plan";
import { daysInMonth, formatLongDate, makeLogDate, parseLogDate, type LogDate } from "@/lib/time";
import type { Units } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The inputs shared by the setup flow and the Settings screens, so both always offer the same
 * choices and ranges. Every one is controlled and works in whole kilograms, centimetres and so on.
 */

// --- lists of choices ----------------------------------------------------------------------------

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; description: string; icon: LucideIcon }[] = [
  { value: "light", title: "0-2", description: "Workouts now and then", icon: Footprints },
  { value: "moderate", title: "3-5", description: "A few workouts per week", icon: Dumbbell },
  { value: "active", title: "6+", description: "Dedicated athlete", icon: Trophy },
];

export const GOAL_OPTIONS: { value: Goal; title: string; icon: LucideIcon }[] = [
  { value: "lose", title: "Lose weight", icon: TrendingDown },
  { value: "maintain", title: "Maintain weight", icon: Equal },
  { value: "gain", title: "Gain weight", icon: TrendingUp },
];

export const DIET_PLAN_OPTIONS: { value: DietPlan; title: string; description: string; icon: LucideIcon }[] = [
  { value: "balanced", title: "Balanced", description: "A well-rounded split for steady energy and overall health.", icon: Scale },
  { value: "high_protein", title: "High-protein", description: "More protein to help build and keep muscle.", icon: Beef },
  { value: "low_carb", title: "Low-carb", description: "Fewer carbs to help manage hunger and keep lean muscle.", icon: Leaf },
  { value: "keto", title: "Keto", description: "Very few carbs and lots of fat, to shift your body into ketosis.", icon: Droplet },
  { value: "high_carb", title: "High-carb", description: "More carbs to fuel endurance and hard training.", icon: Wheat },
];

export const DIETARY_OPTIONS: { value: string | null; title: string }[] = [
  { value: null, title: "No specific diet" },
  { value: "pescatarian", title: "Pescatarian" },
  { value: "vegetarian", title: "Vegetarian" },
  { value: "vegan", title: "Vegan" },
  { value: "flexitarian", title: "Flexitarian" },
  { value: "mediterranean", title: "Mediterranean" },
  { value: "paleo", title: "Paleo" },
  { value: "whole_food", title: "Whole-food focus" },
];

export const ALLERGY_OPTIONS = [
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "fish", label: "Fish" },
  { value: "shellfish", label: "Shellfish" },
  { value: "gluten", label: "Gluten" },
  { value: "nuts", label: "Nuts" },
  { value: "seeds", label: "Seeds" },
  { value: "soy", label: "Soy" },
  { value: "citrus_fruits", label: "Citrus fruits" },
  { value: "red_meat", label: "Red meat" },
  { value: "all_meat", label: "All meat" },
  { value: "animal_products", label: "Animal products" },
] as const;

export const labelOf = {
  sex: (v: Sex | null) => SEX_OPTIONS.find((o) => o.value === v)?.label ?? "Not set",
  activity: (v: ActivityLevel | null) => {
    const a = ACTIVITY_OPTIONS.find((o) => o.value === v);
    return a ? `${a.title} workouts a week` : "Not set";
  },
  goal: (v: Goal | null) => GOAL_OPTIONS.find((o) => o.value === v)?.title ?? "Not set",
  dietPlan: (v: DietPlan) => DIET_PLAN_OPTIONS.find((o) => o.value === v)?.title ?? v,
  dietary: (v: string | null) => DIETARY_OPTIONS.find((o) => o.value === v)?.title ?? "No specific diet",
};

export function SexList({ value, onChange }: { value: Sex | null; onChange: (v: Sex) => void }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Sex">
      {SEX_OPTIONS.map((s) => (
        <ChoiceCard key={s.value} title={s.label} selected={value === s.value} onSelect={() => onChange(s.value)} />
      ))}
    </div>
  );
}

export function ActivityList({ value, onChange }: { value: ActivityLevel | null; onChange: (v: ActivityLevel) => void }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Workouts per week">
      {ACTIVITY_OPTIONS.map((a) => (
        <ChoiceCard
          key={a.value}
          title={a.title}
          description={a.description}
          leading={<a.icon className="size-6" aria-hidden />}
          selected={value === a.value}
          onSelect={() => onChange(a.value)}
        />
      ))}
    </div>
  );
}

export function GoalList({ value, onChange }: { value: Goal | null; onChange: (v: Goal) => void }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Goal">
      {GOAL_OPTIONS.map((g) => (
        <ChoiceCard
          key={g.value}
          title={g.title}
          leading={<g.icon className="size-6" aria-hidden />}
          selected={value === g.value}
          onSelect={() => onChange(g.value)}
        />
      ))}
    </div>
  );
}

export function DietPlanList({ value, onChange }: { value: DietPlan; onChange: (v: DietPlan) => void }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Diet plan">
      {DIET_PLAN_OPTIONS.map((d) => (
        <ChoiceCard
          key={d.value}
          title={d.title}
          description={d.description}
          leading={<d.icon className="size-6" aria-hidden />}
          selected={value === d.value}
          onSelect={() => onChange(d.value)}
        />
      ))}
    </div>
  );
}

export function DietaryList({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Specific diet">
      {DIETARY_OPTIONS.map((d) => (
        <ChoiceCard key={d.title} compact title={d.title} selected={value === d.value} onSelect={() => onChange(d.value)} />
      ))}
    </div>
  );
}

export function AllergyList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (item: string) =>
    onChange(value.includes(item) ? value.filter((r) => r !== item) : [...value, item]);
  return (
    <div className="flex flex-col gap-2">
      <ChoiceCard compact title="No allergies" selected={value.length === 0} onSelect={() => onChange([])} />
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Allergies and restrictions">
        {ALLERGY_OPTIONS.map((a) => (
          <ChoiceCard
            key={a.value}
            compact
            indicator="check"
            title={a.label}
            selected={value.includes(a.value)}
            onSelect={() => toggle(a.value)}
          />
        ))}
      </div>
    </div>
  );
}

// --- height --------------------------------------------------------------------------------------

const FEET_ITEMS = numberItems(2, 8, " ft");
const INCH_ITEMS = numberItems(0, 11, " in");
const CM_ITEMS: WheelItem<number>[] = numberItems(60, 243).map((i) => ({ value: i.value, label: `${i.value} cm` }));

export function HeightPicker({ units, heightCm, onChange }: { units: Units; heightCm: number; onChange: (cm: number) => void }) {
  const imperial = cmToFtIn(heightCm);
  const setImperial = (feet: number, inches: number) =>
    onChange(Math.min(243, Math.max(60, Math.round(ftInToCm(feet, inches)))));

  return units === "metric" ? (
    <WheelPicker label="Height in centimetres" className="mx-auto max-w-[180px]" items={CM_ITEMS} value={Math.round(heightCm)} onChange={onChange} />
  ) : (
    <div className="mx-auto flex w-full max-w-[280px] gap-3">
      <WheelPicker label="Feet" items={FEET_ITEMS} value={imperial.feet} onChange={(ft) => setImperial(ft, imperial.inches)} />
      <WheelPicker label="Inches" items={INCH_ITEMS} value={imperial.inches} onChange={(inch) => setImperial(imperial.feet, inch)} />
    </div>
  );
}

// --- weight --------------------------------------------------------------------------------------

const KG_ITEMS: WheelItem<number>[] = numberItems(20, 360).map((i) => ({ value: i.value, label: `${i.value} kg` }));
const LB_ITEMS: WheelItem<number>[] = numberItems(40, 800).map((i) => ({ value: i.value, label: `${i.value} lb` }));

export function WeightPicker({
  units,
  weightKg,
  onChange,
  label = "Weight",
}: {
  units: Units;
  weightKg: number;
  onChange: (kg: number) => void;
  label?: string;
}) {
  return units === "metric" ? (
    <WheelPicker label={`${label} in kilograms`} className="mx-auto max-w-[180px]" items={KG_ITEMS} value={Math.round(weightKg)} onChange={onChange} />
  ) : (
    <WheelPicker
      label={`${label} in pounds`}
      className="mx-auto max-w-[180px]"
      items={LB_ITEMS}
      value={Math.round(kgToLb(weightKg))}
      onChange={(lb) => onChange(round1(lbToKg(lb)))}
    />
  );
}

// --- date of birth -------------------------------------------------------------------------------

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_ITEMS: WheelItem<number>[] = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

export function BirthdayPicker({
  dateOfBirth,
  today,
  onChange,
}: {
  dateOfBirth: LogDate;
  today: LogDate;
  onChange: (date: LogDate) => void;
}) {
  const { year, month, day } = parseLogDate(dateOfBirth);
  const thisYear = parseLogDate(today).year;
  const newest = thisYear - MIN_AGE;
  const yearItems = useMemo(() => numberItems(thisYear - 100, newest), [thisYear, newest]);
  const dayItems = useMemo(() => numberItems(1, daysInMonth(year, month)), [year, month]);
  const set = (y: number, m: number, d: number) => onChange(makeLogDate(y, m, d));

  return (
    <div className="flex gap-2">
      <WheelPicker className="flex-[1.6]" label="Month" items={MONTH_ITEMS} value={month} onChange={(m) => set(year, m, day)} />
      <WheelPicker className="flex-1" label="Day" items={dayItems} value={Math.min(day, dayItems.length)} onChange={(d) => set(year, month, d)} />
      <WheelPicker className="flex-[1.2]" label="Year" items={yearItems} value={Math.min(year, newest)} onChange={(y) => set(y, month, day)} />
    </div>
  );
}

// --- goal weight ---------------------------------------------------------------------------------

export function GoalWeightPicker({
  goal,
  units,
  weightKg,
  heightCm,
  goalWeightKg,
  onChange,
}: {
  goal: "lose" | "gain";
  units: Units;
  weightKg: number;
  heightCm: number;
  goalWeightKg: number;
  onChange: (kg: number) => void;
}) {
  const range = goalWeightRange(goal, weightKg, heightCm);
  const imperial = units === "imperial";

  const items = useMemo(() => {
    const lo = imperial ? Math.ceil(kgToLb(range.min)) : Math.ceil(range.min);
    const hi = imperial ? Math.floor(kgToLb(range.max)) : Math.floor(range.max);
    return numberItems(Math.min(lo, hi), Math.max(lo, hi)).map((i) => ({ value: i.value, label: `${i.value} ${imperial ? "lb" : "kg"}` }));
  }, [imperial, range.min, range.max]);

  const shown = imperial ? Math.round(kgToLb(goalWeightKg)) : Math.round(goalWeightKg);
  const clamped = Math.min(items[items.length - 1]!.value, Math.max(items[0]!.value, shown));

  return (
    <div className="flex flex-col items-center gap-5">
      <WheelPicker
        label="Goal weight"
        className="max-w-[180px]"
        items={items}
        value={clamped}
        onChange={(v) => onChange(imperial ? round1(lbToKg(v)) : v)}
      />
      <p className="rounded-full bg-muted px-4 py-2 text-sm font-medium">
        {goal === "lose" ? "Lose" : "Gain"} {formatWeight(Math.abs(weightKg - goalWeightKg), units)}
      </p>
    </div>
  );
}

// --- pace ----------------------------------------------------------------------------------------

const PACE_COPY: Record<PaceLevel, { title: string; text: string; icon: LucideIcon }> = {
  slow: { title: "Slow and steady", text: "A gentler pace means a smaller, more sustainable change to your daily calories.", icon: Snail },
  balanced: { title: "Balanced", text: "The most balanced pace. It's motivating and right for most people.", icon: Rabbit },
  fast: { title: "Fast", text: "A quicker pace. It can work, but staying consistent will be harder.", icon: Cat },
};

export function PacePicker({
  goal,
  units,
  paceKgPerWeek,
  weightKg,
  goalWeightKg,
  today,
  onChange,
}: {
  goal: "lose" | "gain";
  units: Units;
  paceKgPerWeek: number;
  weightKg: number;
  goalWeightKg: number;
  today: LogDate;
  onChange: (kgPerWeek: number) => void;
}) {
  const imperial = units === "imperial";
  const gaining = goal === "gain";
  // The slider counts tenths of a kilogram, or tenths of a pound.
  const [min, max] = imperial ? [2, 30] : [1, 15];
  const tenths = Math.min(max, Math.max(min, Math.round(paceKgPerWeek * (imperial ? 22.0462 : 10))));
  const level = paceLevel(paceKgPerWeek, units);
  const copy = PACE_COPY[level];
  const projection = projectGoalDate(goal, weightKg, goalWeightKg, paceKgPerWeek, today);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm text-muted-foreground">{gaining ? "Weight gain" : "Weight loss"} speed per week</span>
        <span className="text-[44px] leading-[48px] font-bold tabular-nums">
          {(tenths / 10).toFixed(1)} <span className="text-2xl">{imperial ? "lbs" : "kg"}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4 px-1">
        <Slider
          min={min}
          max={max}
          step={1}
          value={[tenths]}
          aria-label="Pace per week"
          onValueChange={(next) => {
            const v = Array.isArray(next) ? next[0] : next;
            if (typeof v !== "number") return;
            onChange(imperial ? Math.round((v / 22.0462) * 100) / 100 : v / 10);
          }}
        />
        <div className="flex justify-between px-1">
          {(["slow", "balanced", "fast"] as const).map((l) => {
            const Icon = PACE_COPY[l].icon;
            return (
              <span
                key={l}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full transition-colors",
                  l === level ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-6" aria-hidden />
                <span className="sr-only">{PACE_COPY[l].title}</span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
        <span className="font-semibold">{copy.title}</span>
        <span className="text-sm text-muted-foreground">{copy.text}</span>
      </div>

      {level === "fast" ? (
        <p className="flex items-start gap-2 text-sm" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>
            {gaining
              ? "Gaining this fast tends to add fat rather than muscle."
              : "Losing this fast can leave you tired and is hard to keep up."}
          </span>
        </p>
      ) : null}

      {projection ? (
        <p className="text-center text-sm text-muted-foreground">
          At this pace you&apos;ll reach your goal by{" "}
          <span className="font-semibold text-foreground">{formatLongDate(projection.date)}</span>.
        </p>
      ) : null}
    </div>
  );
}
