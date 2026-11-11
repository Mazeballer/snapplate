"use client";

import { Wand2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatNumber } from "@/lib/format";
import { updateProfile, withCalculatedTargets } from "@/lib/plan";
import type { LogDate } from "@/lib/time";
import type { Profile } from "@/lib/types";

type Field = "calories" | "protein" | "carbs" | "fat";

const FIELDS: { key: Field; label: string; unit: string; min: number; max: number; colorVar: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal", min: 500, max: 10000, colorVar: "--foreground" },
  { key: "protein", label: "Protein", unit: "g", min: 0, max: 1000, colorVar: "--protein" },
  { key: "carbs", label: "Carbs", unit: "g", min: 0, max: 1500, colorVar: "--carbs" },
  { key: "fat", label: "Fat", unit: "g", min: 0, max: 600, colorVar: "--fat" },
];

function TargetsForm({
  profile,
  today,
  onSave,
  onClose,
}: {
  profile: Profile;
  today: LogDate;
  onSave: (profile: Profile) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<Field, string>>({
    calories: String(profile.calorieTarget),
    protein: String(profile.proteinG),
    carbs: String(profile.carbsG),
    fat: String(profile.fatG),
  });

  const parsed = Object.fromEntries(
    FIELDS.map((f) => [f.key, values[f.key] === "" ? NaN : Number(values[f.key])]),
  ) as Record<Field, number>;
  const valid = FIELDS.every((f) => Number.isInteger(parsed[f.key]) && parsed[f.key] >= f.min && parsed[f.key] <= f.max);
  const macroKcal = valid ? parsed.protein * 4 + parsed.carbs * 4 + parsed.fat * 9 : null;

  return (
    <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => {
          const bad = values[f.key] !== "" && !(parsed[f.key] >= f.min && parsed[f.key] <= f.max && Number.isInteger(parsed[f.key]));
          return (
            <label
              key={f.key}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 focus-within:border-foreground"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: `var(${f.colorVar})` }} aria-hidden />
                {f.label}
              </span>
              <span className="flex items-baseline gap-1">
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value.replace(/[^0-9]/g, "") }))}
                  aria-invalid={bad}
                  aria-label={`${f.label} target in ${f.unit}`}
                  className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums outline-none"
                />
                <span className="text-sm text-muted-foreground">{f.unit}</span>
              </span>
              {bad ? (
                <span className="text-xs text-danger">
                  {f.min} to {formatNumber(f.max)}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>

      {macroKcal !== null ? (
        <p className="text-center text-xs text-muted-foreground">
          Your macros add up to {formatNumber(macroKcal)} kcal
          {Math.abs(macroKcal - parsed.calories) > 100 ? `, which differs from your ${formatNumber(parsed.calories)} kcal goal.` : "."}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="h-12 rounded-full text-base font-semibold"
          disabled={!valid}
          onClick={() => {
            onSave(
              updateProfile(
                profile,
                {
                  calorieTarget: parsed.calories,
                  proteinG: parsed.protein,
                  carbsG: parsed.carbs,
                  fatG: parsed.fat,
                },
                today,
              ),
            );
            onClose();
          }}
        >
          Save
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-12 gap-2 rounded-full text-base"
          onClick={() => {
            onSave(withCalculatedTargets(profile, today));
            onClose();
          }}
        >
          <Wand2 aria-hidden />
          Auto-generate from my details
        </Button>
      </div>
    </div>
  );
}

/** Edit the daily calorie and macro targets, or reset them to the calculated ones. */
export function TargetsSheet({
  open,
  onOpenChange,
  profile,
  today,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  today: LogDate;
  onSave: (profile: Profile) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">Daily targets</DrawerTitle>
          <DrawerDescription>
            {profile.calorieOverride ? "You set these yourself." : "Calculated from your details."}
          </DrawerDescription>
        </DrawerHeader>
        <TargetsForm profile={profile} today={today} onSave={onSave} onClose={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}
