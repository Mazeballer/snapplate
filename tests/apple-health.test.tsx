// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Exercise, HealthSyncStatus } from "@/lib/types";

const getHealthSync = vi.fn();
const createHealthToken = vi.fn();
const revokeHealthToken = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) }) }));
vi.mock("@/lib/data", () => ({
  dataSource: {
    getHealthSync: () => getHealthSync(),
    createHealthToken: () => createHealthToken(),
    revokeHealthToken: () => revokeHealthToken(),
    deleteExercise: vi.fn(),
  },
}));

import { AppleHealthScreen } from "@/components/settings/apple-health-screen";
import { ExerciseRow } from "@/components/snapplate/exercise-row";

function renderWith(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const none: HealthSyncStatus = { connected: false, connectedAt: null, lastSyncAt: null };

beforeEach(() => {
  getHealthSync.mockResolvedValue(none);
  createHealthToken.mockResolvedValue("snp_secretkey1234567890");
  revokeHealthToken.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Apple Health screen", () => {
  it("starts not connected, makes a key and shows it with the address", async () => {
    const user = userEvent.setup();
    renderWith(<AppleHealthScreen />);
    expect(await screen.findByText("Not connected")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /create my key/i }));
    expect(await screen.findByText("snp_secretkey1234567890")).toBeTruthy();
    expect(screen.getByText(/\/api\/health-sync$/)).toBeTruthy();
    expect(createHealthToken).toHaveBeenCalledTimes(1);
  });

  it("shows when the last sync happened and never shows the key again", async () => {
    getHealthSync.mockResolvedValue({
      connected: true,
      connectedAt: new Date(Date.now() - 86_400_000).toISOString(),
      lastSyncAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    });
    renderWith(<AppleHealthScreen />);
    expect(await screen.findByText("Connected")).toBeTruthy();
    expect(screen.getByText(/Last sync 2 hours ago/)).toBeTruthy();
    expect(screen.queryByText(/snp_/)).toBeNull();
    expect(screen.getByRole("button", { name: /sync now/i }).getAttribute("href")).toBe("shortcuts://run-shortcut?name=Snapplate%20Sync");
  });

  it("disconnects", async () => {
    const user = userEvent.setup();
    getHealthSync.mockResolvedValue({ connected: true, connectedAt: new Date().toISOString(), lastSyncAt: null });
    renderWith(<AppleHealthScreen />);
    await user.click(await screen.findByRole("button", { name: /disconnect/i }));
    await waitFor(() => expect(revokeHealthToken).toHaveBeenCalledTimes(1));
  });

  it("explains a failure to make a key", async () => {
    const user = userEvent.setup();
    createHealthToken.mockRejectedValue(new Error("Could not make a key: function does not exist"));
    renderWith(<AppleHealthScreen />);
    await user.click(await screen.findByRole("button", { name: /create my key/i }));
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(String(toastError.mock.calls[0]![0])).toContain("function does not exist");
  });
});

describe("workouts from Apple Health", () => {
  const base: Exercise = { id: "e1", loggedAt: new Date().toISOString(), logDate: "2026-11-18", name: "Running", durationMin: 30, intensity: null, calories: 300, source: "manual" };

  it("can be deleted when logged by hand", () => {
    renderWith(<ExerciseRow exercise={base} />);
    expect(screen.getByRole("button", { name: /delete running/i })).toBeTruthy();
  });

  it("are labelled and cannot be deleted, since the next sync would bring them back", () => {
    renderWith(<ExerciseRow exercise={{ ...base, source: "shortcut" }} />);
    expect(screen.getByText(/Apple Health/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
