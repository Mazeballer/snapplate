// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKeyboardReset } from "@/hooks/use-keyboard-reset";

function Probe() {
  useKeyboardReset(300);
  return (
    <div>
      <input aria-label="a" />
      <input aria-label="b" />
      <button type="button">x</button>
    </div>
  );
}

let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  scrollTo = vi.fn();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  Object.defineProperty(window, "scrollY", { value: 120, configurable: true });
  Object.defineProperty(window, "visualViewport", { value: { offsetTop: 0, height: 800 }, configurable: true });
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("keyboard reset", () => {
  it("puts the page back where it was after the keyboard closes and the page was pushed", () => {
    const { getByLabelText } = render(<Probe />);
    const a = getByLabelText("a") as HTMLInputElement;
    a.focus();
    // iOS pushes the page up while the keyboard is open.
    Object.defineProperty(window, "scrollY", { value: 200, configurable: true });
    a.blur();
    vi.advanceTimersByTime(350);
    expect(scrollTo).toHaveBeenCalledWith(0, 120);
  });

  it("does nothing while moving from one field to another", () => {
    const { getByLabelText } = render(<Probe />);
    const a = getByLabelText("a") as HTMLInputElement;
    const b = getByLabelText("b") as HTMLInputElement;
    a.focus();
    a.blur();
    b.focus();
    vi.advanceTimersByTime(350);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves a page alone that was never moved", () => {
    const { getByLabelText } = render(<Probe />);
    const a = getByLabelText("a") as HTMLInputElement;
    a.focus();
    a.blur();
    vi.advanceTimersByTime(350);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

import { act, render as renderAgain } from "@testing-library/react";
import { useRef } from "react";
import { useBottomPin, useFieldFocused } from "@/hooks/use-keyboard-reset";

function Bar() {
  const typing = useFieldFocused(300);
  const ref = useRef<HTMLElement>(null);
  useBottomPin(ref);
  return (
    <div>
      <nav ref={ref} data-typing={typing} aria-label="bar" />
      <input aria-label="name" />
      <input type="checkbox" aria-label="switch" />
    </div>
  );
}

describe("tab bar behaviour", () => {
  beforeEach(() => {
    Object.defineProperty(window, "visualViewport", {
      value: { scale: 1, offsetTop: 0, height: 800, addEventListener: () => undefined, removeEventListener: () => undefined },
      configurable: true,
    });
  });

  it("hides while a text field is focused and comes back after the keyboard closes", () => {
    const { getByLabelText } = renderAgain(<Bar />);
    const bar = getByLabelText("bar");
    expect(bar.getAttribute("data-typing")).not.toBe("true");

    act(() => (getByLabelText("name") as HTMLInputElement).focus());
    expect(bar.getAttribute("data-typing")).toBe("true");

    act(() => (getByLabelText("name") as HTMLInputElement).blur());
    expect(bar.getAttribute("data-typing")).toBe("true"); // still settling
    act(() => void vi.advanceTimersByTime(350));
    expect(bar.getAttribute("data-typing")).not.toBe("true"); // shown again
  });

  it("stays visible when a switch or checkbox is focused, since they bring up no keyboard", () => {
    const { getByLabelText } = renderAgain(<Bar />);
    act(() => (getByLabelText("switch") as HTMLInputElement).focus());
    expect(getByLabelText("bar").getAttribute("data-typing")).not.toBe("true");
  });

  it("holds the bar on the bottom edge when the page is displaced, and leaves it alone otherwise", () => {
    const listeners: Record<string, () => void> = {};
    const viewport = {
      scale: 1,
      offsetTop: 0,
      height: 800,
      addEventListener: (type: string, fn: () => void) => void (listeners[type] = fn),
      removeEventListener: () => undefined,
    };
    Object.defineProperty(window, "visualViewport", { value: viewport, configurable: true });
    vi.stubGlobal("requestAnimationFrame", (fn: () => void) => setTimeout(fn, 0));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
    const { getByLabelText } = renderAgain(<Bar />);
    const bar = getByLabelText("bar");
    expect(bar.style.transform).toBe("");

    // The visible area ends 40px above where the layout thinks the bottom is.
    viewport.height = 760;
    act(() => {
      listeners.resize?.();
      vi.advanceTimersByTime(20);
    });
    expect(bar.style.transform).toBe("translate3d(0px, -40px, 0px)");

    viewport.height = 800;
    act(() => {
      listeners.resize?.();
      vi.advanceTimersByTime(20);
    });
    expect(bar.style.transform).toBe("");

    // Pinch-zoomed: hands off.
    viewport.height = 500;
    viewport.scale = 2;
    act(() => {
      listeners.resize?.();
      vi.advanceTimersByTime(20);
    });
    expect(bar.style.transform).toBe("");
    vi.unstubAllGlobals();
  });
});
