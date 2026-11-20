// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import { AppleHealthGuide } from "@/components/settings/apple-health-guide";
import { SHORTCUT_NAME } from "@/lib/health-shortcut";

afterEach(cleanup);

describe("Apple Health setup guide", () => {
  it("covers the whole setup, from the key to automation and fixes", () => {
    render(<AppleHealthGuide />);
    for (const heading of ["What this does", "Before you start", "Part 1: Build the shortcut", "Part 2: Test it", "Part 3: Make it run by itself", "If something goes wrong"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }
    expect(screen.getByText("Read today's steps")).toBeTruthy();
    expect(screen.getByText("Read today's active calories")).toBeTruthy();
  });

  it("gives the exact shortcut name and this site's address, each copyable", () => {
    render(<AppleHealthGuide />);
    expect(screen.getByText(SHORTCUT_NAME, { selector: "span.font-mono" })).toBeTruthy();
    expect(screen.getByText(/\/api\/health-sync$/, { selector: "span.font-mono" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy Shortcut name" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy Address" })).toBeTruthy();
  });

  it("links back to the Apple Health screen", () => {
    render(<AppleHealthGuide />);
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/settings/apple-health");
  });
});
