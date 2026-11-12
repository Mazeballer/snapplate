"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { LogPage } from "@/components/log/log-page";
import { useLogDate, useSaveMeal } from "@/components/log/use-log";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { scoreMeal } from "@/lib/healthScore";
import { defaultMealType, emptyDraft } from "@/lib/meal";
import { minutesSinceMidnight } from "@/lib/time";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

/** Digits with at most one decimal point. */
const cleanNumber = (raw: string) => raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1").slice(0, 7);

function NumberField({
  label,
  unit,
  value,
  onChange,
  required,
  colorVar,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  colorVar?: string;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 focus-within:border-foreground">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {colorVar ? <span className="size-2 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden /> : null}
        {label}
        {required ? <span aria-hidden>*</span> : null}
      </span>
      <span className="flex items-baseline gap-1">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(cleanNumber(e.target.value))}
          aria-label={`${label} in ${unit}`}
          aria-required={required}
          placeholder="0"
          className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </span>
    </label>
  );
}

export function ManualScreen() {
  const logDate = useLogDate();
  const { save, saving } = useSaveMeal(logDate);

  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>(() => defaultMealType(minutesSinceMidnight()));
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [sodium, setSodium] = useState("");
  const [more, setMore] = useState(false);
  const [favourite, setFavourite] = useState(false);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const opt = (v: string) => (v === "" ? null : Number(v));
  const kcal = Number(calories);
  const valid = name.trim().length > 0 && calories !== "" && kcal > 0 && kcal <= 10_000;

  function submit() {
    if (!valid) return;
    const base = emptyDraft(mealType);
    const nutrients = {
      calories: kcal,
      proteinG: num(protein),
      carbsG: num(carbs),
      fatG: num(fat),
      fiberG: opt(fiber),
      sugarG: opt(sugar),
      sodiumMg: opt(sodium),
    };
    // With the numbers typed in we can still give the meal a health score.
    const { score, factors } = scoreMeal({ ...nutrients, processing: "mixed" });
    void save(
      { ...base, ...nutrients, name, healthScore: score, factors, source: "manual" },
      { favourite },
    );
  }

  return (
    <LogPage
      title="Add manually"
      footer={
        <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={!valid || saving} onClick={submit}>
          {saving ? "Saving…" : "Add meal"}
        </Button>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Name *</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 120))}
          placeholder="For example: Nasi lemak"
          aria-required
          className="h-12 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-foreground"
        />
      </label>

      <div role="radiogroup" aria-label="Meal" className="grid grid-cols-4 gap-1.5">
        {MEAL_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={mealType === t.value}
            onClick={() => setMealType(t.value)}
            className={cn(
              "h-10 rounded-full text-[0.8rem] font-semibold transition-colors",
              mealType === t.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <NumberField label="Calories" unit="kcal" value={calories} onChange={setCalories} required />
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Protein" unit="g" value={protein} onChange={setProtein} colorVar="--protein" />
        <NumberField label="Carbs" unit="g" value={carbs} onChange={setCarbs} colorVar="--carbs" />
        <NumberField label="Fat" unit="g" value={fat} onChange={setFat} colorVar="--fat" />
      </div>

      <button
        type="button"
        onClick={() => setMore((m) => !m)}
        aria-expanded={more}
        className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left font-medium"
      >
        More nutrients
        <ChevronDown className={cn("size-5 transition-transform", more && "rotate-180")} aria-hidden />
      </button>
      {more ? (
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Fibre" unit="g" value={fiber} onChange={setFiber} />
          <NumberField label="Sugar" unit="g" value={sugar} onChange={setSugar} />
          <NumberField label="Sodium" unit="mg" value={sodium} onChange={setSodium} />
        </div>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <span className="pr-3">
          <span className="block font-medium">Save to my meals</span>
          <span className="block text-xs text-muted-foreground">Quickly log it again later.</span>
        </span>
        <Switch checked={favourite} onCheckedChange={setFavourite} aria-label="Save to my meals" />
      </div>
    </LogPage>
  );
}
