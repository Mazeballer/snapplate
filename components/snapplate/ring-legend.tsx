import { RING_COLORS } from "@/components/snapplate/ring-colors";
import { RING_OVER_KCAL, RING_TOLERANCE_KCAL, type RingState } from "@/lib/rings";

const ROWS: { state: RingState; name: string; meaning: string }[] = [
  { state: "empty", name: "Dotted", meaning: "No meals logged that day" },
  { state: "under", name: "Dark", meaning: `More than ${RING_TOLERANCE_KCAL} calories under your goal` },
  { state: "on", name: "Green", meaning: `On target, within ${RING_TOLERANCE_KCAL} calories of your goal` },
  { state: "slightly_over", name: "Yellow", meaning: `${RING_TOLERANCE_KCAL} to ${RING_OVER_KCAL - 1} calories over your goal` },
  { state: "over", name: "Red", meaning: `${RING_OVER_KCAL} or more calories over your goal` },
];

function Swatch({ state }: { state: RingState }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle
        cx={12}
        cy={12}
        r={9.5}
        fill="none"
        stroke={RING_COLORS[state]}
        strokeOpacity={state === "empty" ? 0.5 : 1}
        strokeWidth={state === "empty" ? 2 : 3}
        strokeDasharray={state === "empty" ? "1.5 4.5" : undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** What each colour of ring on the home calendar means. */
export function RingLegend() {
  return (
    <ul className="flex flex-col gap-3">
      {ROWS.map(({ state, name, meaning }) => (
        <li key={state} className="flex items-center gap-3">
          <Swatch state={state} />
          <span className="text-sm leading-snug">
            <span className="font-bold">{name}</span> <span className="text-muted-foreground">{meaning}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
