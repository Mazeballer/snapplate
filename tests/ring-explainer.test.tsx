// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RING_EXPLAINER_KEY, RingExplainer } from "@/components/snapplate/ring-explainer";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("RingExplainer", () => {
  it("shows until dismissed, then stays gone, even after a reload", async () => {
    const user = userEvent.setup();
    const first = render(<RingExplainer />);
    expect(await screen.findByText("Ring Colors Explained")).toBeTruthy();

    // Not dismissed by anything except the X: re-rendering keeps it.
    first.rerender(<RingExplainer />);
    expect(screen.queryByText("Ring Colors Explained")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Ring Colors Explained")).toBeNull();
    expect(window.localStorage.getItem(RING_EXPLAINER_KEY)).toBe("1");

    // A fresh mount (a reload) does not bring it back.
    first.unmount();
    render(<RingExplainer />);
    expect(screen.queryByText("Ring Colors Explained")).toBeNull();
  });
});
