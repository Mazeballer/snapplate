import { Heart } from "lucide-react";
import { formatScore, HEALTH_TONE_CLASSES, healthBand } from "@/lib/healthScore";
import { cn } from "@/lib/utils";

/** A small pill with a meal's health score (0-10). */
export function HealthChip({ score, className }: { score: number; className?: string }) {
  const band = healthBand(score);
  return (
    <span
      title={`${band.label} (${formatScore(score)} out of 10)`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        HEALTH_TONE_CLASSES[band.tone],
        className,
      )}
    >
      <Heart className="size-3" aria-hidden />
      {formatScore(score)}
    </span>
  );
}
