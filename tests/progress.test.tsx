// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Meal, WeightLog } from "@/lib/types";

const getWeightLogs = vi.fn();
const getMeals = vi.fn();
const getProfile = vi.fn();

vi.mock("@/lib/data", () => ({
  dataSource: {
    getProfile: () => getProfile(),
    getWeightLogs: () => getWeightLogs(),
    getMeals: () => getMeals(),
  },
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));

import { ProgressScreen } from "@/components/snapplate/progress-screen";
import { DEFAULT_DRAFT, draftToProfile } from "@/lib/onboarding";
import { addDays, todayLogDate } from "@/lib/time";

const today = todayLogDate();
const profile = { ...draftToProfile({ ...DEFAULT_DRAFT, weightKg: 70, heightCm: 170 }, today)!, onboarded: true };

function meal(logDate: string, calories: number): Meal {
  return {
    id: `m-${logDate}`,
    loggedAt: `${logDate}T04:00:00.000Z`,
    logDate,
    mealType: "lunch",
    name: "Nasi lemak",
    emoji: "🍛",
    imageUrl: null,
    calories,
    proteinG: 20,
    carbsG: 60,
    fatG: 20,
    fiberG: null,
    sugarG: null,
    sodiumMg: null,
    servings: 1,
    healthScore: 6,
    factors: [],
    source: "text",
    items: [],
  };
}

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ProgressScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getProfile.mockResolvedValue(profile);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Progress with real data", () => {
  it("handles a brand-new account: one weigh-in from setup and no meals", async () => {
    const weights: WeightLog[] = [{ logDate: today, weightKg: 70 }];
    getWeightLogs.mockResolvedValue(weights);
    getMeals.mockResolvedValue([]);
    renderScreen();

    expect(await screen.findByText("Log another weigh-in to see your trend.")).toBeTruthy();
    expect(screen.getByLabelText("Your weight").textContent).toContain("70");
    expect(screen.getByText(/Started at/)).toBeTruthy();
    expect(screen.getByLabelText("Day streak").textContent).toContain("0");
  });

  it("shows the chart, streak and average once there is history", async () => {
    getWeightLogs.mockResolvedValue([
      { logDate: addDays(today, -20), weightKg: 72 },
      { logDate: addDays(today, -10), weightKg: 71 },
      { logDate: today, weightKg: 70 },
    ]);
    getMeals.mockResolvedValue([meal(today, 2000), meal(addDays(today, -1), 1800), meal(addDays(today, -2), 2200)]);
    renderScreen();

    expect(await screen.findByLabelText(/Weight trend from 72 kg to 70 kg/)).toBeTruthy();
    expect(screen.getByLabelText("Day streak").textContent).toContain("3");
    expect(screen.getByLabelText(/Calories for the last 7 days, averaging 2,000/)).toBeTruthy();
  });

  it("shows a retry state when the weights cannot be loaded", async () => {
    getWeightLogs.mockRejectedValue(new Error("network"));
    getMeals.mockResolvedValue([]);
    renderScreen();

    expect(await screen.findByText("Couldn't load your progress")).toBeTruthy();
  });
});
