"use client";

import { useEffect } from "react";

const FIELDS = "input, textarea, select, [contenteditable='true']";

function isField(element: Element | null): boolean {
  return element instanceof HTMLElement && element.matches(FIELDS);
}

/**
 * iPhone quirk: after the on-screen keyboard closes in an installed web app, the page can stay
 * pushed up and the bottom bar floats above the bottom edge. Once the last field loses focus,
 * put the page back where it was and let the browser lay it out again.
 */
export function useKeyboardReset(delayMs = 300) {
  useEffect(() => {
    let scrollBefore: number | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function onFocusIn(event: FocusEvent) {
      if (!isField(event.target as Element | null)) return;
      clearTimeout(timer);
      if (scrollBefore === null) scrollBefore = window.scrollY;
    }

    function onFocusOut() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Moving between fields is not "done": wait until none is focused.
        if (isField(document.activeElement)) return;
        const target = scrollBefore ?? 0;
        scrollBefore = null;
        const viewport = window.visualViewport;
        const displaced = viewport ? viewport.offsetTop !== 0 || viewport.height < window.innerHeight - 1 : false;
        if (displaced || Math.abs(window.scrollY - target) > 1) window.scrollTo(0, target);
      }, delayMs);
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [delayMs]);
}
