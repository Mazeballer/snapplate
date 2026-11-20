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
