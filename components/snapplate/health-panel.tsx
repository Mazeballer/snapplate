import { CircleAlert, CircleCheck, Heart, TriangleAlert, type LucideIcon } from "lucide-react";
import { formatScore, HEALTH_TONE_CLASSES, healthBand } from "@/lib/healthScore";
import type { FactorQuality, HealthFactor } from "@/lib/types";
import { cn } from "@/lib/utils";

const FACTOR_ICON: Record<FactorQuality, { icon: LucideIcon; className: string }> = {
  good: { icon: CircleCheck, className: "text-success" },
  fair: { icon: CircleAlert, className: "text-warning" },
  bad: { icon: TriangleAlert, className: "text-danger" },
};

/** A meal's health score with the reasons behind it. */
export function HealthPanel({ score, factors }: { score: number; factors: HealthFactor[] }) {
  const band = healthBand(score);
  return (
    <section className="flex flex-col gap-3 rounded-[15px] border-[1.5px] border-input bg-card p-4" aria-label="Health score">
      <div className="flex items-center gap-3">
        <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[15px] bg-background">
          <Heart className="size-6" style={{ color: "var(--protein)" }} fill="currentColor" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold">Health score</h3>
            <span className="text-base font-bold tabular-nums">{formatScore(score)}/10</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full border-2 border-input bg-background box-content" aria-hidden>
            <div className="h-full rounded-full bg-foreground transition-[width] duration-700" style={{ width: `${(score / 10) * 100}%` }} />
          </div>
        </div>
      </div>
      <span className={cn("self-start rounded-full px-2.5 py-1 text-xs font-semibold", HEALTH_TONE_CLASSES[band.tone])}>{band.label}</span>
      {factors.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {factors.map((factor) => {
            const { icon: Icon, className } = FACTOR_ICON[factor.quality];
            return (
              <li key={factor.label} className="flex items-start gap-2.5">
                <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden />
                <span className="text-sm leading-snug">
                  <span className="font-medium">{factor.label}.</span> <span className="text-muted-foreground">{factor.note}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
