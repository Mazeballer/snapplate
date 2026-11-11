"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 56;
const VISIBLE = 5;

export interface WheelItem<T> {
  value: T;
  label: string;
}

/**
 * A scrolling wheel that snaps one row to the middle, like the height and weight pickers in the
 * reference app. Scroll or tap a row to choose it; arrow keys work too.
 */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: WheelItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrolling = useRef(false);
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));

  const scrollToIndex = useCallback((index: number, smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Keep the wheel on the chosen value when it changes from outside (or on first show).
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || userScrolling.current) return;
    if (Math.abs(el.scrollTop - selectedIndex * ITEM_HEIGHT) > 1) scrollToIndex(selectedIndex, false);
  }, [selectedIndex, items, scrollToIndex]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  function handleScroll() {
    const el = scroller.current;
    if (!el) return;
    userScrolling.current = true;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      userScrolling.current = false;
      const index = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)));
      const next = items[index];
      if (next && next.value !== value) onChange(next.value);
    }, 90);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = items[Math.min(items.length - 1, Math.max(0, selectedIndex + step))];
    if (next) onChange(next.value);
  }

  const pad = ITEM_HEIGHT * Math.floor(VISIBLE / 2);

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height: ITEM_HEIGHT * VISIBLE }}
      role="spinbutton"
      aria-label={label}
      aria-valuenow={typeof value === "number" ? value : selectedIndex}
      aria-valuetext={items[selectedIndex]?.label}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* The band behind the chosen row. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 rounded-[10px] bg-muted"
        style={{ top: pad, height: ITEM_HEIGHT }}
      />
      <div
        ref={scroller}
        onScroll={handleScroll}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: pad }}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          return (
            <button
              key={String(item.value)}
              type="button"
              tabIndex={-1}
              onClick={() => {
                scrollToIndex(index, true);
                if (item.value !== value) onChange(item.value);
              }}
              className={cn(
                "flex w-full snap-center items-center justify-center tabular-nums transition-[font-size,opacity] duration-150",
                distance === 0 ? "text-[26px] font-semibold" : distance === 1 ? "text-xl opacity-70" : "text-lg opacity-40",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A list of whole numbers as wheel items, e.g. 60 to 243 with a unit suffix. */
export function numberItems(from: number, to: number, suffix = ""): WheelItem<number>[] {
  return Array.from({ length: to - from + 1 }, (_, i) => ({
    value: from + i,
    label: `${from + i}${suffix}`,
  }));
}
