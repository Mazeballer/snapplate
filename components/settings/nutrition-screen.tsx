"use client";

import { Beef, Droplet, ShieldAlert, Utensils, Wand2, Wheat } from "lucide-react";
import { useState } from "react";
import { EditorGate } from "@/components/settings/editor-gate";
import { FieldSheet, SettingsButtonRow, SettingsGroup, SettingsPage } from "@/components/settings/settings-ui";
import { AllergyList, DietaryList, DietPlanList, labelOf } from "@/components/snapplate/pickers";
import { CalorieCard, MacroRingCard } from "@/components/snapplate/ring-cards";
import { TargetsSheet } from "@/components/snapplate/targets-sheet";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { withCalculatedTargets } from "@/lib/plan";

type Field = "targets" | "diet" | "dietary" | "allergies";

export function NutritionScreen() {
  const [open, setOpen] = useState<Field | null>(null);
  const close = (o: boolean) => {
    if (!o) setOpen(null);
  };

  return (
    <SettingsPage title="Nutrition goals">
      <EditorGate>
        {({ profile, today, change, replace }) => (
          <>
            <div className="flex flex-col gap-2">
              <button type="button" className="text-left" onClick={() => setOpen("targets")} aria-label="Edit daily targets">
                <CalorieCard value={formatNumber(profile.calorieTarget)} label="Daily calories" progress={1} />
              </button>
              <div className="flex gap-2">
                <MacroRingCard label="Protein" value={`${profile.proteinG}g`} caption="" progress={1} colorVar="--protein" icon={Beef} onClick={() => setOpen("targets")} />
                <MacroRingCard label="Carbs" value={`${profile.carbsG}g`} caption="" progress={1} colorVar="--carbs" icon={Wheat} onClick={() => setOpen("targets")} />
                <MacroRingCard label="Fats" value={`${profile.fatG}g`} caption="" progress={1} colorVar="--fat" icon={Droplet} onClick={() => setOpen("targets")} />
              </div>
            </div>

            <p className="px-1 text-sm text-muted-foreground">
              {profile.calorieOverride
                ? "These are your own numbers, so changes to your body details or diet won't move them."
                : "Calculated from your details. Tap a card to type your own numbers."}
            </p>

            {profile.calorieOverride ? (
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 rounded-full"
                onClick={() => replace(withCalculatedTargets(profile, today))}
              >
                <Wand2 aria-hidden />
                Auto-generate from my details
              </Button>
            ) : null}

            <SettingsGroup title="Diet">
              <SettingsButtonRow icon={Utensils} label="Macro split" value={labelOf.dietPlan(profile.dietPlan)} onClick={() => setOpen("diet")} />
              <SettingsButtonRow icon={Utensils} label="Specific diet" value={labelOf.dietary(profile.dietaryPreference)} onClick={() => setOpen("dietary")} />
              <SettingsButtonRow
                icon={ShieldAlert}
                label="Allergies"
                value={profile.restrictions.length === 0 ? "None" : `${profile.restrictions.length} selected`}
                onClick={() => setOpen("allergies")}
              />
            </SettingsGroup>

            <TargetsSheet open={open === "targets"} onOpenChange={close} profile={profile} today={today} onSave={replace} />

            <FieldSheet open={open === "diet"} onOpenChange={close} title="Macro split" initial={profile.dietPlan} onCommit={(v) => change({ dietPlan: v })}>
              {(value, setValue) => <DietPlanList value={value} onChange={setValue} />}
            </FieldSheet>

            <FieldSheet open={open === "dietary"} onOpenChange={close} title="Specific diet" initial={profile.dietaryPreference} onCommit={(v) => change({ dietaryPreference: v })}>
              {(value, setValue) => <DietaryList value={value} onChange={setValue} />}
            </FieldSheet>

            <FieldSheet open={open === "allergies"} onOpenChange={close} title="Allergies" initial={profile.restrictions} onCommit={(v) => change({ restrictions: v })}>
              {(value, setValue) => <AllergyList value={value} onChange={setValue} />}
            </FieldSheet>
          </>
        )}
      </EditorGate>
    </SettingsPage>
  );
}
