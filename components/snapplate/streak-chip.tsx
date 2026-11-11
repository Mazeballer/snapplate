import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** The logging streak, in days. Dimmed at zero. */
export function StreakChip({ days }: { days: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold tabular-nums",
        days === 0 && "text-muted-foreground",
      )}
      aria-label={`${days} day streak`}
    >
      <Flame
        className="size-4"
        style={{ color: days > 0 ? "var(--warning)" : undefined }}
        fill={days > 0 ? "currentColor" : "none"}
        aria-hidden
      />
      {days}
    </span>
  );
}
