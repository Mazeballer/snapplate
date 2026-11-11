import type { RingState } from "@/lib/rings";

/** Colour for each calendar-ring state. */
export const RING_COLORS: Record<RingState, string> = {
  empty: "var(--muted-foreground)",
  under: "var(--foreground)",
  on: "var(--success)",
  slightly_over: "var(--warning)",
  over: "var(--danger)",
};
