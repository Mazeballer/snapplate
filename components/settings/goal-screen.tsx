"use client";

import { Activity, Gauge, Scale, Target, Weight } from "lucide-react";
import { useState } from "react";
import { EditorGate } from "@/components/settings/editor-gate";
import { FieldSheet, SettingsButtonRow, SettingsGroup, SettingsPage } from "@/components/settings/settings-ui";
import { ActivityList, GoalList, GoalWeightPicker, labelOf, PacePicker, WeightPicker } from "@/components/snapplate/pickers";
import { formatWeight, weightUnit, weightValue } from "@/lib/format";
import { projectGoalDate } from "@/lib/nutrition";
import { changeGoal } from "@/lib/plan";
import { formatLongDate } from "@/lib/time";

type Field = "weight" | "goal" | "goalWeight" | "pace" | "activity";

export function GoalScreen() {
  const [open, setOpen] = useState<Field | null>(null);
  const close = (o: boolean) => {
    if (!o) setOpen(null);
  };

  return (
    <SettingsPage title="Goal & current weight">
      <EditorGate>
        {({ profile, today, change, replace }) => {
          const units = profile.units;
          const weight = profile.weightKg ?? 70;
          const height = profile.heightCm ?? 167;
          const goal = profile.goal;
          const aiming = goal === "lose" || goal === "gain";
          const goalKg = profile.goalWeightKg ?? weight;
          const pace = profile.paceKgPerWeek ?? 0.8;
          const projection = aiming && goal ? projectGoalDate(goal, weight, goalKg, pace, today) : null;

          return (
            <>
              <section className="flex flex-col gap-1 rounded-[18px] border border-border bg-card p-5" aria-label="Goal summary">
                <span className="text-xs font-medium text-muted-foreground">Your goal</span>
                <span className="text-xl font-bold">
                  {goal === "maintain"
                    ? "Maintain your weight"
                    : `${goal === "gain" ? "Gain" : "Lose"} ${formatWeight(Math.abs(weight - goalKg), units)}`}
                </span>
                {projection ? (
                  <span className="text-sm text-muted-foreground">
                    On track for <span className="font-semibold text-foreground">{formatLongDate(projection.date)}</span>
                  </span>
                ) : null}
              </section>

              <SettingsGroup>
                <SettingsButtonRow icon={Weight} label="Current weight" value={formatWeight(weight, units)} onClick={() => setOpen("weight")} />
                <SettingsButtonRow icon={Target} label="Goal" value={labelOf.goal(goal)} onClick={() => setOpen("goal")} />
                {aiming ? (
                  <>
                    <SettingsButtonRow icon={Scale} label="Goal weight" value={formatWeight(goalKg, units)} onClick={() => setOpen("goalWeight")} />
                    <SettingsButtonRow
                      icon={Gauge}
                      label="Weekly pace"
                      value={`${weightValue(pace, units)} ${weightUnit(units)} / week`}
                      onClick={() => setOpen("pace")}
                    />
                  </>
                ) : null}
                <SettingsButtonRow icon={Activity} label="Activity level" value={labelOf.activity(profile.activityLevel)} onClick={() => setOpen("activity")} />
              </SettingsGroup>
              <p className="px-1 text-xs text-muted-foreground">
                Logging a new weight also adds it to your Progress chart. Changes here update your daily targets, unless you set them yourself.
              </p>

              <FieldSheet
                open={open === "weight"}
                onOpenChange={close}
                title="Current weight"
                initial={weight}
                onCommit={(kg) => change({ weightKg: kg }, { logDate: today, weightKg: kg })}
              >
                {(value, setValue) => <WeightPicker units={units} weightKg={value} onChange={setValue} label="Current weight" />}
              </FieldSheet>

              <FieldSheet
                open={open === "goal"}
                onOpenChange={close}
                title="Goal"
                initial={goal}
                canSave={(v) => v !== null}
                onCommit={(v) => v && replace(changeGoal(profile, v, today))}
              >
                {(value, setValue) => <GoalList value={value} onChange={setValue} />}
              </FieldSheet>

              <FieldSheet open={open === "goalWeight"} onOpenChange={close} title="Goal weight" initial={goalKg} onCommit={(kg) => change({ goalWeightKg: kg })}>
                {(value, setValue) => (
                  <GoalWeightPicker
                    goal={goal === "gain" ? "gain" : "lose"}
                    units={units}
                    weightKg={weight}
                    heightCm={height}
                    goalWeightKg={value}
                    onChange={setValue}
                  />
                )}
              </FieldSheet>

              <FieldSheet open={open === "pace"} onOpenChange={close} title="Weekly pace" initial={pace} onCommit={(v) => change({ paceKgPerWeek: v })}>
                {(value, setValue) => (
                  <PacePicker
                    goal={goal === "gain" ? "gain" : "lose"}
                    units={units}
                    paceKgPerWeek={value}
                    weightKg={weight}
                    goalWeightKg={goalKg}
                    today={today}
                    onChange={setValue}
                  />
                )}
              </FieldSheet>

              <FieldSheet
                open={open === "activity"}
                onOpenChange={close}
                title="Workouts per week"
                initial={profile.activityLevel}
                canSave={(v) => v !== null}
                onCommit={(v) => v && change({ activityLevel: v })}
              >
                {(value, setValue) => <ActivityList value={value} onChange={setValue} />}
              </FieldSheet>
            </>
          );
        }}
      </EditorGate>
    </SettingsPage>
  );
}
