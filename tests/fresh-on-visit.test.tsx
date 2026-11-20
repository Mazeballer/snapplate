// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { FreshOnVisit } from "@/components/log/fresh-on-visit";

function Flow() {
  const [saving, setSaving] = useState(false);
  return (
    <button type="button" onClick={() => setSaving(true)}>
      {saving ? "Saving…" : "Add meal"}
    </button>
  );
}

afterEach(cleanup);

describe("FreshOnVisit", () => {
  it("starts clean when a hidden page is shown again", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Activity mode="visible">
        <FreshOnVisit>
          <Flow />
        </FreshOnVisit>
      </Activity>,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("Saving…");

    // Leaving the page hides it; coming back shows it again.
    await act(async () => {
      rerender(
        <Activity mode="hidden">
          <FreshOnVisit>
            <Flow />
          </FreshOnVisit>
        </Activity>,
      );
    });
    await act(async () => {
      rerender(
        <Activity mode="visible">
          <FreshOnVisit>
            <Flow />
          </FreshOnVisit>
        </Activity>,
      );
    });
    expect(screen.getByRole("button").textContent).toBe("Add meal");
  });

  it("keeps state while the page stays open", async () => {
    const user = userEvent.setup();
    render(
      <FreshOnVisit>
        <Flow />
      </FreshOnVisit>,
    );
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("Saving…");
  });
});
