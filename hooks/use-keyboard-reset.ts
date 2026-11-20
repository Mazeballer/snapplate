"use client";

import { useEffect, useState, type RefObject } from "react";

/** Inputs that don't bring up the keyboard (switches, checkboxes, sliders, buttons). */
const NO_KEYBOARD = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "file", "color", "image", "hidden"]);

/** A field that opens the on-screen keyboard. */
function isField(element: Element | null): boolean {
  if (element instanceof HTMLInputElement) return !NO_KEYBOARD.has(element.type);
  return element instanceof HTMLTextAreaElement || (element instanceof HTMLElement && element.isContentEditable);
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

/** True while a text field is focused (so the on-screen keyboard is, or is about to be, up). */
export function useFieldFocused(settleMs = 350): boolean {
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onFocusIn(event: FocusEvent) {
      if (!isField(event.target as Element | null)) return;
      clearTimeout(timer);
      setFocused(true);
    }
    function onFocusOut() {
      clearTimeout(timer);
      // Wait for the keyboard to finish closing before showing the bar again.
      timer = setTimeout(() => setFocused(isField(document.activeElement)), settleMs);
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [settleMs]);
  return focused;
}

/**
 * Keeps a bottom-fixed element on the bottom edge of what the person can see. Normally that's
 * exactly where `bottom: 0` already puts it, so nothing changes; when iOS leaves the page
 * displaced after the keyboard, the element is nudged back instead of floating above the edge.
 */
export function useBottomPin(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;
    let frame = 0;

    function apply() {
      frame = 0;
      if (!viewport || !element) return;
      // Pinch-zoomed: the visual viewport means something else, leave the bar alone.
      const shift = viewport.scale === 1 ? Math.round(viewport.offsetTop + viewport.height - window.innerHeight) : 0;
      element.style.transform = shift === 0 ? "" : `translate3d(0, ${shift}px, 0)`;
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(apply);
    }

    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);
    apply();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      element.style.transform = "";
    };
  }, [ref]);
}
