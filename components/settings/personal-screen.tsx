"use client";

import { Cake, CircleUser, Ruler, Venus } from "lucide-react";
import { useState } from "react";
import { EditorGate } from "@/components/settings/editor-gate";
import { FieldSheet, SettingsButtonRow, SettingsGroup, SettingsPage } from "@/components/settings/settings-ui";
import { BirthdayPicker, HeightPicker, labelOf, SexList } from "@/components/snapplate/pickers";
import { cmToFtIn } from "@/lib/nutrition";
import { ageOn, formatLongDate } from "@/lib/time";

type Field = "name" | "sex" | "dob" | "height";

export function PersonalScreen() {
  const [open, setOpen] = useState<Field | null>(null);
  const close = (o: boolean) => {
    if (!o) setOpen(null);
  };

  return (
    <SettingsPage title="Personal details">
      <EditorGate>
        {({ profile, today, change }) => {
          const height = profile.heightCm;
          const imperial = height !== null ? cmToFtIn(height) : null;
          return (
            <>
              <SettingsGroup>
                <SettingsButtonRow icon={CircleUser} label="Name" value={profile.displayName ?? "Not set"} onClick={() => setOpen("name")} />
                <SettingsButtonRow icon={Venus} label="Sex" value={labelOf.sex(profile.sex)} onClick={() => setOpen("sex")} />
                <SettingsButtonRow
                  icon={Cake}
                  label="Date of birth"
                  value={profile.dateOfBirth ? `${formatLongDate(profile.dateOfBirth)} (${ageOn(profile.dateOfBirth, today)})` : "Not set"}
                  onClick={() => setOpen("dob")}
                />
                <SettingsButtonRow
                  icon={Ruler}
                  label="Height"
                  value={
                    height === null
                      ? "Not set"
                      : profile.units === "imperial" && imperial
                        ? `${imperial.feet} ft ${imperial.inches} in`
                        : `${Math.round(height)} cm`
                  }
                  onClick={() => setOpen("height")}
                />
              </SettingsGroup>
              <p className="px-1 text-xs text-muted-foreground">
                Changing your sex, birthday or height updates your daily targets, unless you set them yourself.
              </p>

              <FieldSheet open={open === "name"} onOpenChange={close} title="Name" initial={profile.displayName ?? ""} onCommit={(v) => change({ displayName: v.trim() || null })}>
                {(value, setValue) => (
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, 40))}
                    placeholder="Your name"
                    aria-label="Name"
                    autoComplete="given-name"
                    className="h-12 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-foreground"
                  />
                )}
              </FieldSheet>

              <FieldSheet open={open === "sex"} onOpenChange={close} title="Sex" initial={profile.sex} canSave={(v) => v !== null} onCommit={(v) => v && change({ sex: v })}>
                {(value, setValue) => <SexList value={value} onChange={setValue} />}
              </FieldSheet>

              <FieldSheet
                open={open === "dob"}
                onOpenChange={close}
                title="Date of birth"
                initial={profile.dateOfBirth ?? "2000-01-01"}
                onCommit={(v) => change({ dateOfBirth: v })}
              >
                {(value, setValue) => <BirthdayPicker dateOfBirth={value} today={today} onChange={setValue} />}
              </FieldSheet>

              <FieldSheet open={open === "height"} onOpenChange={close} title="Height" initial={height ?? 167} onCommit={(v) => change({ heightCm: v })}>
                {(value, setValue) => <HeightPicker units={profile.units} heightCm={value} onChange={setValue} />}
              </FieldSheet>
            </>
          );
        }}
      </EditorGate>
    </SettingsPage>
  );
}

