"use client";

import { CloudOff, Scale } from "lucide-react";
import { SettingsGroup, SettingsPage } from "@/components/settings/settings-ui";
import { EmptyState } from "@/components/snapplate/empty-state";
import { useProfile, useWeightLogs } from "@/hooks/use-data";
import { formatWeight, formatWeightChange } from "@/lib/format";
import { formatLongDate } from "@/lib/time";

/** Every weigh-in, newest first, with the change since the one before. */
export function WeightHistoryScreen() {
  const weights = useWeightLogs();
  const { data: profile } = useProfile();
  const units = profile?.units ?? "metric";

  return (
    <SettingsPage title="Weight history">
      {weights.isError ? (
        <EmptyState icon={CloudOff} title="Couldn't load your weigh-ins">
          Check your connection and try again.
        </EmptyState>
      ) : weights.isPending ? (
        <div className="h-48 animate-pulse rounded-[18px] bg-muted" aria-busy="true" />
      ) : weights.data.length === 0 ? (
        <EmptyState icon={Scale} title="No weigh-ins yet">
          Log your weight from the Progress tab and it will show up here.
        </EmptyState>
      ) : (
        <SettingsGroup>
          {[...weights.data].reverse().map((entry, i, newestFirst) => {
            const before = newestFirst[i + 1];
            const delta = before ? entry.weightKg - before.weightKg : null;
            return (
              <div key={entry.logDate} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="flex flex-col">
                  <span className="font-semibold tabular-nums">{formatWeight(entry.weightKg, units)}</span>
                  <span className="text-xs text-muted-foreground">{formatLongDate(entry.logDate)}</span>
                </span>
                {delta !== null && Math.abs(delta) >= 0.05 ? (
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">{formatWeightChange(delta, units)}</span>
                ) : null}
              </div>
            );
          })}
        </SettingsGroup>
      )}
    </SettingsPage>
  );
}
