import { Beef, Droplet, Flame, Wheat, type LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";

/** The calories card, macro cards and fibre/sugar/sodium cards, shared by the scan result and the meal detail. */

function Macro({ label, value, colorVar, icon: Icon }: { label: string; value: number; colorVar: string; icon: LucideIcon }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-[15px] border-[1.5px] border-input bg-card py-3">
      <span
        className="flex size-8 items-center justify-center rounded-full"
        style={{ background: `color-mix(in oklab, var(${colorVar}) 16%, transparent)`, color: `var(${colorVar})` }}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="text-lg leading-none font-bold tabular-nums">{Math.round(value)}g</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function CaloriesCard({ calories }: { calories: number }) {
  return (
    <div className="flex items-center gap-3 rounded-[15px] border-[1.5px] border-input bg-card p-4">
      <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[15px] bg-background">
        <Flame className="size-7" style={{ color: "var(--warning)" }} fill="currentColor" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-muted-foreground">Calories</span>
        <span className="text-[34px] leading-9 font-bold tabular-nums">{formatNumber(calories)}</span>
      </span>
    </div>
  );
}

export function MacroCards({ proteinG, carbsG, fatG }: { proteinG: number; carbsG: number; fatG: number }) {
  return (
    <div className="flex gap-2">
      <Macro label="Protein" value={proteinG} colorVar="--protein" icon={Beef} />
      <Macro label="Carbs" value={carbsG} colorVar="--carbs" icon={Wheat} />
      <Macro label="Fats" value={fatG} colorVar="--fat" icon={Droplet} />
    </div>
  );
}

/** Renders nothing when none of the three is known. */
export function MoreNutrition({ fiberG, sugarG, sodiumMg }: { fiberG: number | null; sugarG: number | null; sodiumMg: number | null }) {
  if (fiberG === null && sugarG === null && sodiumMg === null) return null;
  const cells = [
    { label: "Fiber", text: fiberG === null ? "-" : `${Math.round(fiberG)}g` },
    { label: "Sugar", text: sugarG === null ? "-" : `${Math.round(sugarG)}g` },
    { label: "Sodium", text: sodiumMg === null ? "-" : `${formatNumber(Math.round(sodiumMg))}mg` },
  ];
  return (
    <section className="grid grid-cols-3 gap-2" aria-label="More nutrition">
      {cells.map(({ label, text }) => (
        <div key={label} className="flex flex-col items-center gap-0.5 rounded-[15px] border-[1.5px] border-input bg-card py-3">
          <span className="text-base font-bold tabular-nums">{text}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </section>
  );
}
