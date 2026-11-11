"use client";

import { Flame, Footprints, Repeat2, Ruler } from "lucide-react";
import { useState } from "react";
import { EditorGate } from "@/components/settings/editor-gate";
import {
  FieldSheet,
  SettingsButtonRow,
  SettingsControlRow,
  SettingsGroup,
  SettingsPage,
} from "@/components/settings/settings-ui";
import { Segmented } from "@/components/snapplate/segmented";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";

export function PreferencesScreen() {
  const [editingSteps, setEditingSteps] = useState(false);

  return (
    <SettingsPage title="Preferences">
      <EditorGate>
        {({ profile, change }) => (
          <>
            <SettingsGroup title="Daily goal">
              <SettingsControlRow
                icon={Flame}
                label="Add calories burned back"
                description="Your goal goes up by the calories you burn."
                control={
                  <Switch
                    checked={profile.addBurnedCalories}
                    onCheckedChange={(checked) => change({ addBurnedCalories: checked })}
                    aria-label="Add calories burned back to your daily goal"
                  />
                }
              />
              <SettingsControlRow
                icon={Repeat2}
                label="Rollover extra calories"
                description="Up to 200 unused calories carry over to the next day."
                control={
                  <Switch
                    checked={profile.rolloverCalories}
                    onCheckedChange={(checked) => change({ rolloverCalories: checked })}
                    aria-label="Rollover extra calories to the next day"
                  />
                }
              />
            </SettingsGroup>

            <SettingsGroup title="Tracking">
              <SettingsButtonRow icon={Footprints} label="Daily step goal" value={`${formatNumber(profile.stepGoal)} steps`} onClick={() => setEditingSteps(true)} />
              <SettingsControlRow
                icon={Ruler}
                label="Measurement"
                control={
                  <Segmented
                    label="Measurement units"
                    options={[
                      { value: "metric", label: "Metric" },
                      { value: "imperial", label: "Imperial" },
                    ]}
                    value={profile.units}
                    onChange={(units) => change({ units })}
                    className="[&_button]:min-w-0 [&_button]:px-3"
                  />
                }
              />
            </SettingsGroup>

            <FieldSheet
              open={editingSteps}
              onOpenChange={setEditingSteps}
              title="Daily step goal"
              initial={String(profile.stepGoal)}
              canSave={(v) => Number(v) >= 1000 && Number(v) <= 50000}
              onCommit={(v) => change({ stepGoal: Number(v) })}
            >
              {(value, setValue) => (
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">Between 1,000 and 50,000 steps</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                    aria-label="Daily step goal"
                    className="h-14 w-full rounded-xl border border-border bg-card px-4 text-2xl font-semibold tabular-nums outline-none focus:border-foreground"
                  />
                </label>
              )}
            </FieldSheet>
          </>
        )}
      </EditorGate>
    </SettingsPage>
  );
}
