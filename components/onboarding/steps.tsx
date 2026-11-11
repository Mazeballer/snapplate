"use client";

import { Beef, Check, Droplet, Wheat } from "lucide-react";
import { useEffect, useState } from "react";
import { StepHeading } from "@/components/onboarding/shell";
import { ChoiceCard } from "@/components/snapplate/choice-card";
import {
  ActivityList,
  AllergyList,
  BirthdayPicker,
  DietaryList,
  DietPlanList,
  GoalList,
  GoalWeightPicker,
  HeightPicker,
  PacePicker,
  SexList,
  WeightPicker,
} from "@/components/snapplate/pickers";
import { CalorieCard, MacroRingCard } from "@/components/snapplate/ring-cards";
import { Segmented } from "@/components/snapplate/segmented";
import { TargetsSheet } from "@/components/snapplate/targets-sheet";
import { formatNumber, formatWeight } from "@/lib/format";
import type { Goal } from "@/lib/nutrition";
import type { Draft } from "@/lib/onboarding";
import { buildPlan, planInputFromProfile } from "@/lib/plan";
import { formatLongDate, type LogDate } from "@/lib/time";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Update = (patch: Partial<Draft>) => void;
interface StepProps {
  draft: Draft;
  update: Update;
}

function UnitSwitch({ draft, update }: StepProps) {
  return (
    <div className="flex justify-center">
      <Segmented
        label="Units"
        options={[
          { value: "imperial", label: "Imperial" },
          { value: "metric", label: "Metric" },
        ]}
        value={draft.units}
        onChange={(units) => update({ units })}
      />
    </div>
  );
}

export function SexStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="Choose your sex" subtitle="This helps us tailor your plan. The calorie formula differs between sexes." />
      <div className="mt-8">
        <SexList value={draft.sex} onChange={(sex) => update({ sex })} />
      </div>
    </>
  );
}

export function ActivityStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="How many workouts do you do per week?" subtitle="This will be used to calibrate your custom plan." />
      <div className="mt-8">
        <ActivityList value={draft.activity} onChange={(activity) => update({ activity })} />
      </div>
    </>
  );
}

export function HeightStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="What is your height?" subtitle="This will be taken into account when calculating your daily nutrition goals." />
      <div className="mt-6 flex flex-col gap-6">
        <UnitSwitch draft={draft} update={update} />
        <HeightPicker units={draft.units} heightCm={draft.heightCm} onChange={(heightCm) => update({ heightCm })} />
      </div>
    </>
  );
}

export function WeightStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="What is your weight?" subtitle="This will be taken into account when calculating your daily nutrition goals." />
      <div className="mt-6 flex flex-col gap-6">
        <UnitSwitch draft={draft} update={update} />
        <WeightPicker units={draft.units} weightKg={draft.weightKg} onChange={(weightKg) => update({ weightKg })} />
      </div>
    </>
  );
}

export function BirthdayStep({ draft, update, today }: StepProps & { today: LogDate }) {
  return (
    <>
      <StepHeading title="When were you born?" subtitle="This helps us build your plan. Your age changes how many calories you need." />
      <div className="mt-8">
        <BirthdayPicker dateOfBirth={draft.dateOfBirth} today={today} onChange={(dateOfBirth) => update({ dateOfBirth })} />
      </div>
    </>
  );
}

export function GoalStep({ draft, onPick }: { draft: Draft; onPick: (goal: Goal) => void }) {
  return (
    <>
      <StepHeading title="What is your goal?" subtitle="This helps us generate a plan for your calorie intake." />
      <div className="mt-8">
        <GoalList value={draft.goal} onChange={onPick} />
      </div>
    </>
  );
}

export function GoalWeightStep({ draft, update }: StepProps) {
  const goal = draft.goal === "gain" ? "gain" : "lose";
  return (
    <>
      <StepHeading title="What is your desired weight?" />
      <div className="mt-6">
        <GoalWeightPicker
          goal={goal}
          units={draft.units}
          weightKg={draft.weightKg}
          heightCm={draft.heightCm}
          goalWeightKg={draft.goalWeightKg ?? draft.weightKg}
          onChange={(goalWeightKg) => update({ goalWeightKg })}
        />
      </div>
    </>
  );
}

export function PaceStep({ draft, update, today }: StepProps & { today: LogDate }) {
  const goal = draft.goal === "gain" ? "gain" : "lose";
  return (
    <>
      <StepHeading title="How fast do you want to reach your goal?" />
      <div className="mt-6">
        <PacePicker
          goal={goal}
          units={draft.units}
          paceKgPerWeek={draft.paceKgPerWeek}
          weightKg={draft.weightKg}
          goalWeightKg={draft.goalWeightKg ?? draft.weightKg}
          today={today}
          onChange={(paceKgPerWeek) => update({ paceKgPerWeek })}
        />
      </div>
    </>
  );
}

export function DietPlanStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="Choose your diet" subtitle="This sets how your calories are split into protein, carbs and fat." />
      <div className="mt-6">
        <DietPlanList value={draft.dietPlan} onChange={(dietPlan) => update({ dietPlan })} />
      </div>
    </>
  );
}

export function DietaryStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="Do you follow a specific diet?" subtitle="Optional. We keep it with your profile." />
      <div className="mt-6">
        <DietaryList value={draft.dietary} onChange={(dietary) => update({ dietary })} />
      </div>
    </>
  );
}

export function AllergiesStep({ draft, update }: StepProps) {
  return (
    <>
      <StepHeading title="Do you have any food restrictions or allergies?" subtitle="Pick any that apply, or skip." />
      <div className="mt-6">
        <AllergyList value={draft.restrictions} onChange={(restrictions) => update({ restrictions })} />
      </div>
    </>
  );
}

function YesNo({
  title,
  note,
  value,
  onChange,
  label,
}: {
  title: string;
  note: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <>
      <StepHeading title={title} />
      <div className="mt-8 flex flex-col gap-2" role="radiogroup" aria-label={label}>
        <ChoiceCard title="Yes" selected={value === true} onSelect={() => onChange(true)} />
        <ChoiceCard title="No" selected={value === false} onSelect={() => onChange(false)} />
      </div>
      <p className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{note}</p>
    </>
  );
}

export function BurnedStep({ draft, update }: StepProps) {
  return (
    <YesNo
      title="Add calories burned back to your daily goal?"
      note="If you burn 300 calories walking or working out, your goal goes up by 300 that day so you can eat them back."
      label="Add burned calories"
      value={draft.addBurned}
      onChange={(addBurned) => update({ addBurned })}
    />
  );
}

export function RolloverStep({ draft, update }: StepProps) {
  return (
    <YesNo
      title="Rollover extra calories to the next day?"
      note="Up to 200 calories you didn't eat yesterday are added to today's goal."
      label="Rollover calories"
      value={draft.rollover}
      onChange={(rollover) => update({ rollover })}
    />
  );
}

// --- building ----------------------------------------------------------------------------------

const BUILD_TASKS = [
  "Applying the BMR formula",
  "Estimating your daily calories",
  "Splitting your macros",
  "Projecting your goal date",
];

export function BuildingStep({ onDone }: { onDone: () => void }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setPercent((p) => Math.min(100, p + 4)), 90);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (percent < 100) return;
    const timer = setTimeout(onDone, 400);
    return () => clearTimeout(timer);
  }, [percent, onDone]);

  const done = Math.floor((percent / 100) * BUILD_TASKS.length);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center" role="status" aria-live="polite">
      <span className="text-[64px] leading-none font-bold tabular-nums">{percent}%</span>
      <h1 className="text-[28px] leading-8 font-bold tracking-tight">We&apos;re building your plan</h1>
      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-foreground transition-[width] duration-100" style={{ width: `${percent}%` }} />
      </div>
      <ul className="flex flex-col gap-3 text-left">
        {BUILD_TASKS.map((task, i) => (
          <li key={task} className={cn("flex items-center gap-3 text-[15px] transition-opacity", i <= done ? "opacity-100" : "opacity-30")}>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full",
                i < done ? "bg-foreground text-background" : "border-2 border-border",
              )}
            >
              {i < done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : null}
            </span>
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- plan --------------------------------------------------------------------------------------

export function PlanStep({
  profile,
  today,
  onEdit,
}: {
  profile: Profile;
  today: LogDate;
  onEdit: (profile: Profile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const input = planInputFromProfile(profile);
  const plan = input ? buildPlan(input, today) : null;
  const goal = profile.goal;
  const goalLine =
    plan?.projection && goal && goal !== "maintain" && profile.goalWeightKg !== null
      ? `${goal === "lose" ? "Lose" : "Gain"} ${formatWeight(Math.abs((profile.weightKg ?? 0) - profile.goalWeightKg), profile.units)} by ${formatLongDate(plan.projection.date)}`
      : goal === "maintain"
        ? "Maintain your current weight"
        : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
          <Check className="size-6" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="mt-2 text-[32px] leading-[37px] font-bold tracking-tight">Your custom plan is ready</h1>
        {goalLine ? <p className="text-base font-medium">{goalLine}</p> : null}
      </div>

      <div className="mt-6 flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Daily recommendation</h2>
        <p className="text-sm text-muted-foreground">You can edit this any time. Tap a card to change it.</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" className="text-left" onClick={() => setEditing(true)} aria-label="Edit daily targets">
          <CalorieCard value={formatNumber(profile.calorieTarget)} label="Calories" progress={1} />
        </button>
        <div className="flex gap-2">
          <MacroRingCard label="Protein" value={`${profile.proteinG}g`} caption="" progress={1} colorVar="--protein" icon={Beef} onClick={() => setEditing(true)} />
          <MacroRingCard label="Carbs" value={`${profile.carbsG}g`} caption="" progress={1} colorVar="--carbs" icon={Wheat} onClick={() => setEditing(true)} />
          <MacroRingCard label="Fats" value={`${profile.fatG}g`} caption="" progress={1} colorVar="--fat" icon={Droplet} onClick={() => setEditing(true)} />
        </div>
      </div>

      {plan ? (
        <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
          <li>
            Your body burns about <span className="font-semibold text-foreground">{formatNumber(plan.maintenance)}</span> calories a day.
          </li>
          {plan.floored ? (
            <li className="text-foreground">We kept your calories at the lowest safe level, so you may reach your goal a bit later.</li>
          ) : null}
          <li>
            Your BMI is <span className="font-semibold text-foreground">{plan.bmi.toFixed(1)}</span> ({plan.bmiCategory}).
          </li>
        </ul>
      ) : null}

      <p className="mt-6 text-xs text-muted-foreground">These are estimates from a standard formula, not medical advice.</p>

      <TargetsSheet open={editing} onOpenChange={setEditing} profile={profile} today={today} onSave={onEdit} />
    </>
  );
}
