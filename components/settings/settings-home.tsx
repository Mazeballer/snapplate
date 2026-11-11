"use client";

import { Apple, FileText, RotateCcw, SlidersHorizontal, Target, UserRound, Utensils } from "lucide-react";
import { SettingsButtonRow, SettingsGroup, SettingsLinkRow } from "@/components/settings/settings-ui";
import { MockBanner } from "@/components/snapplate/mock-banner";
import { ThemePicker } from "@/components/snapplate/theme-picker";
import { useProfile } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { formatNumber, formatWeight } from "@/lib/format";
import { cmToFtIn } from "@/lib/nutrition";
import { ageOn } from "@/lib/time";

function ProfileCard() {
  const { data: profile, isPending } = useProfile();
  const today = useToday();

  if (isPending || !today) {
    return <div className="h-24 animate-pulse rounded-[18px] bg-muted" aria-busy="true" />;
  }
  if (!profile) {
    return (
      <section className="rounded-[18px] border border-border bg-card p-5">
        <p className="font-semibold">Your profile isn&apos;t set up yet</p>
        <p className="text-sm text-muted-foreground">Start the setup below to get your daily targets.</p>
      </section>
    );
  }

  const name = profile.displayName?.trim() || "Your profile";
  const facts = [
    profile.dateOfBirth ? `${ageOn(profile.dateOfBirth, today)} yrs` : null,
    profile.heightCm !== null
      ? profile.units === "imperial"
        ? `${cmToFtIn(profile.heightCm).feet}'${cmToFtIn(profile.heightCm).inches}"`
        : `${Math.round(profile.heightCm)} cm`
      : null,
    profile.weightKg !== null ? formatWeight(profile.weightKg, profile.units) : null,
  ].filter(Boolean);

  return (
    <section className="flex items-center gap-4 rounded-[18px] border border-border bg-card p-5" aria-label="Your profile">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background" aria-hidden>
        {name.charAt(0).toUpperCase()}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-lg font-bold">{name}</span>
        <span className="text-sm text-muted-foreground">{facts.join(" · ") || "Add your details"}</span>
        <span className="text-sm text-muted-foreground">{formatNumber(profile.calorieTarget)} kcal a day</span>
      </div>
    </section>
  );
}

export function SettingsHome() {
  return (
    <div className="flex flex-col gap-5">
      <MockBanner />
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <ProfileCard />

      <SettingsGroup title="Goals & tracking">
        <SettingsLinkRow href="/settings/personal" icon={UserRound} label="Personal details" />
        <SettingsLinkRow href="/settings/goal" icon={Target} label="Goal & current weight" />
        <SettingsLinkRow href="/settings/nutrition" icon={Utensils} label="Nutrition goals" />
        <SettingsLinkRow href="/settings/preferences" icon={SlidersHorizontal} label="Preferences" />
      </SettingsGroup>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-sm font-medium text-muted-foreground">Appearance</h2>
        <ThemePicker />
      </section>

      <SettingsGroup title="Connections">
        <SettingsButtonRow icon={Apple} label="Apple Health" badge="Coming soon" disabled />
      </SettingsGroup>

      <SettingsGroup title="Support & legal">
        <SettingsLinkRow href="/privacy" icon={FileText} label="Privacy policy" />
      </SettingsGroup>

      <SettingsGroup title="Setup">
        <SettingsLinkRow href="/onboarding" icon={RotateCcw} label="Restart setup" />
      </SettingsGroup>
    </div>
  );
}
