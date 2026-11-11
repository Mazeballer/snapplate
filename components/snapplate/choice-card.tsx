import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A tappable option, shaped like the reference app's: a white card with a thin border that turns
 * into a 2px dark border when chosen, with a round indicator at the right.
 * Use `indicator="check"` for pick-many lists and "radio" for pick-one lists.
 */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
  leading,
  indicator = "radio",
  compact = false,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  indicator?: "radio" | "check" | "none";
  compact?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role={indicator === "check" ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl bg-card px-4 text-left transition-[border-color,transform] active:scale-[0.99]",
        compact ? "min-h-12 py-2.5" : "min-h-16 py-3",
        selected ? "border-2 border-foreground" : "border border-border",
        className,
      )}
    >
      {leading ? <span className="flex size-10 shrink-0 items-center justify-center">{leading}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-base font-semibold leading-5">{title}</span>
        {description ? <span className="mt-0.5 text-[0.8rem] leading-snug text-muted-foreground">{description}</span> : null}
      </span>
      {indicator !== "none" ? (
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected ? "border-foreground bg-foreground text-background" : "border-border",
          )}
        >
          {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </span>
      ) : null}
    </button>
  );
}
