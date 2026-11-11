import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";

/** Protein, carbs or fat for the day: grams left, with a thin progress bar. */
export function MacroCard({
  label,
  icon: Icon,
  eaten,
  goal,
  colorVar,
}: {
  label: string;
  icon: LucideIcon;
  eaten: number;
  goal: number;
  /** CSS variable name of the macro's colour, e.g. "--protein". */
  colorVar: string;
}) {
  const left = goal - eaten;
  const over = left < 0;
  const pct = goal > 0 ? Math.min(100, Math.max(0, (eaten / goal) * 100)) : 0;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-muted/60 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" style={{ color: `var(${colorVar})` }} aria-hidden />
        {label}
      </div>
      <div className="leading-tight">
        <span className="text-xl font-semibold tabular-nums">
          {formatNumber(Math.abs(left))}
          <span className="text-sm">g</span>
        </span>
        <span className="block text-xs text-muted-foreground">{over ? "over" : "left"}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-background"
        role="progressbar"
        aria-label={`${label} eaten`}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.round(eaten)}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: `var(${colorVar})` }}
        />
      </div>
    </div>
  );
}
