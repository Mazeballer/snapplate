"use client";

import { Droplet } from "lucide-react";
import { toast } from "sonner";
import { useAddWater } from "@/hooks/use-data";
import { GLASS_ML, WATER_GOAL_ML } from "@/lib/constants";
import { formatWater } from "@/lib/format";

/** Water for the selected day, with quick-add buttons when it is today. */
export function WaterCard({ ml, canAdd }: { ml: number; canAdd: boolean }) {
  const addWater = useAddWater();
  const glasses = Math.round(WATER_GOAL_ML / GLASS_ML);
  const filled = Math.min(glasses, Math.floor(ml / GLASS_ML));

  function add(amount: number) {
    addWater.mutate(amount, {
      onError: () => toast.error("Couldn't log water. Please try again."),
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Droplet className="size-3.5" style={{ color: "var(--fat)" }} aria-hidden />
        Water
      </div>
      <div className="leading-tight">
        <span className="text-xl font-semibold tabular-nums">{formatWater(ml)}</span>
        <span className="block text-xs text-muted-foreground">of {formatWater(WATER_GOAL_ML)}</span>
      </div>
      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: glasses }, (_, i) => (
          <span
            key={i}
            className="h-5 flex-1 rounded-full"
            style={{ background: i < filled ? "var(--fat)" : "var(--background)" }}
          />
        ))}
      </div>
      {canAdd ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => add(GLASS_ML)}
            disabled={addWater.isPending}
            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-background text-sm font-semibold transition-colors active:bg-border disabled:opacity-60"
          >
            +{GLASS_ML} ml
          </button>
          <button
            type="button"
            onClick={() => add(GLASS_ML * 2)}
            disabled={addWater.isPending}
            className="flex h-10 flex-1 items-center justify-center rounded-xl bg-background text-sm font-semibold transition-colors active:bg-border disabled:opacity-60"
          >
            +{GLASS_ML * 2} ml
          </button>
        </div>
      ) : null}
    </div>
  );
}
