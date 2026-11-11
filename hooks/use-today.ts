"use client";

import { useSyncExternalStore } from "react";
import { todayLogDate, type LogDate } from "@/lib/time";

// Re-check once a minute so the app rolls over to the next day at midnight Malaysia time,
// and whenever the app comes back to the foreground.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/**
 * Today's log date in Malaysia time, or null during server rendering. The server has no
 * trusted idea of "now" for a cached page, so anything that shows the date renders it
 * after mount.
 */
export function useToday(): LogDate | null {
  return useSyncExternalStore<LogDate | null>(
    subscribe,
    () => todayLogDate(),
    () => null,
  );
}
