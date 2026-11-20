"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "snapplate:dismissed";

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * Whether a one-time tip has been dismissed, remembered on this device. A tip stays until it is
 * dismissed, and never comes back after. On the server it counts as dismissed, so someone who
 * already dismissed it never sees it flash up while the page loads.
 */
export function useDismissed(key: string): [dismissed: boolean, dismiss: () => void] {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => true,
  );
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: it will show again next visit, which is the safe failure.
    }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);
  return [dismissed, dismiss];
}
