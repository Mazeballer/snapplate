import { CircleAlert, CircleCheck, TriangleAlert, type LucideIcon } from "lucide-react";
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
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4" aria-label="Health score">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Health score</h3>
        <span className={cn("rounded-full px-2.5 py-1 text-sm font-semibold", HEALTH_TONE_CLASSES[band.tone])}>
          {formatScore(score)}/10 · {band.label}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background" aria-hidden>
        <div className="h-full rounded-full bg-foreground transition-[width] duration-700" style={{ width: `${(score / 10) * 100}%` }} />
      </div>
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
