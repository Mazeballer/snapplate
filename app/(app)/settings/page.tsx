import { Suspense } from "react";
import { AccountSection } from "@/components/snapplate/account-section";
import { SettingsHome } from "@/components/settings/settings-home";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <SettingsHome />
      <Suspense fallback={<div className="h-36 animate-pulse rounded-2xl bg-muted" />}>
        <AccountSection />
      </Suspense>
    </div>
  );
}
