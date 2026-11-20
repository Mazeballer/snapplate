import { SettingsPage } from "@/components/settings/settings-ui";
import { RingLegend } from "@/components/snapplate/ring-legend";

export const metadata = { title: "Ring colors" };

export default function Page() {
  return (
    <SettingsPage title="Ring Colors Explained">
      <p className="text-sm text-muted-foreground">On the home calendar, the rings around each date show how close you were to your daily calorie goal.</p>
      <div className="rounded-[18px] border border-border bg-card p-5">
        <RingLegend />
      </div>
    </SettingsPage>
  );
}
