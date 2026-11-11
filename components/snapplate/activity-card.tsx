import { Flame, Footprints } from "lucide-react";
import { formatNumber } from "@/lib/format";

/** Steps and active calories for the day (from Apple Health through the Shortcut). */
export function ActivityCard({
  steps,
  activeKcal,
  stepGoal,
  hasData,
}: {
  steps: number;
  activeKcal: number;
  stepGoal: number;
  hasData: boolean;
}) {
  const pct = stepGoal > 0 ? Math.min(100, (steps / stepGoal) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Footprints className="size-3.5" style={{ color: "var(--success)" }} aria-hidden />
        Steps
      </div>
      {hasData ? (
        <>
          <div className="leading-tight">
            <span className="text-xl font-semibold tabular-nums">{formatNumber(steps)}</span>
            <span className="block text-xs text-muted-foreground">of {formatNumber(stepGoal)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-background" aria-hidden>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${pct}%`, background: "var(--success)" }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Flame className="size-4" style={{ color: "var(--warning)" }} aria-hidden />
            <span className="font-semibold tabular-nums">{formatNumber(activeKcal)}</span>
            <span className="text-xs text-muted-foreground">kcal burned</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No steps yet. Connect Apple Health in Settings to see them here.
        </p>
      )}
    </div>
  );
}
