"use client";

import { X } from "lucide-react";
import { RingLegend } from "@/components/snapplate/ring-legend";
import { useDismissed } from "@/hooks/use-dismissed";

export const RING_EXPLAINER_KEY = "snapplate:ring-explainer-dismissed";

/**
 * A one-time card under the home calendar explaining the ring colours. It stays until it is
 * dismissed with the X, and does not come back after that.
 */
export function RingExplainer() {
  const [dismissed, dismiss] = useDismissed(RING_EXPLAINER_KEY);
  if (dismissed) return null;

  return (
    <section className="relative flex flex-col gap-3 rounded-[15px] border-[1.5px] border-input bg-card p-4" aria-label="Ring colors explained">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold">Ring Colors Explained</h2>
          <p className="text-sm text-muted-foreground">The rings around each date show how close you were to your daily calorie goal.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <RingLegend />
    </section>
  );
}
