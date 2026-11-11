import { Suspense } from "react";
import { AccountSection } from "@/components/snapplate/account-section";
import { ThemePicker } from "@/components/snapplate/theme-picker";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Appearance</h2>
        <ThemePicker />
      </section>
      <Suspense fallback={<div className="h-36 animate-pulse rounded-2xl bg-muted" />}>
        <AccountSection />
      </Suspense>
    </div>
  );
}
