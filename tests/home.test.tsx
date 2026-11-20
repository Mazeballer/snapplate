// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Meal } from "@/lib/types";

const replace = vi.fn();
const source = {
  getProfile: vi.fn(),
  getMeals: vi.fn(),
  getWater: vi.fn(),
  getActivity: vi.fn(),
  getExercise: vi.fn(),
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/lib/data", () => ({
  dataSource: {
    getProfile: () => source.getProfile(),
    getMeals: () => source.getMeals(),
    getWater: () => source.getWater(),
    getActivity: () => source.getActivity(),
    getExercise: () => source.getExercise(),
  },
}));

import { HomeScreen } from "@/components/snapplate/home-screen";
import { SelectedDateProvider } from "@/components/snapplate/selected-date";
import { DEFAULT_DRAFT, draftToProfile } from "@/lib/onboarding";
import { todayLogDate } from "@/lib/time";

const today = todayLogDate();
const base = draftToProfile(DEFAULT_DRAFT, today)!;
const profile = { ...base, calorieTarget: 2000, onboarded: true };

function meal(calories: number): Meal {
  return {
    id: `m-${calories}`,
    loggedAt: new Date().toISOString(),
    logDate: today,
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

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SelectedDateProvider>
        <HomeScreen />
      </SelectedDateProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  source.getProfile.mockResolvedValue(profile);
  source.getMeals.mockResolvedValue([]);
  source.getWater.mockResolvedValue({});
  source.getActivity.mockResolvedValue([]);
  source.getExercise.mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Home with real data", () => {
  it("shows the full goal and an empty state on a day with nothing logged", async () => {
    renderHome();
    expect(await screen.findByText("Nothing logged")).toBeTruthy();
    expect(screen.getByLabelText("Calories left").textContent).toContain("2,000");
  });

  it("subtracts logged meals from the goal", async () => {
    source.getMeals.mockResolvedValue([meal(700), meal(300)]);
    renderHome();
    expect(await screen.findByLabelText("Calories left")).toBeTruthy();
    expect(screen.getByLabelText("Calories left").textContent).toContain("1,000");
    expect(screen.getAllByText("Nasi lemak").length).toBe(2);
  });

  it("adds burned calories to the goal when that setting is on", async () => {
    source.getProfile.mockResolvedValue({ ...profile, addBurnedCalories: true });
    source.getMeals.mockResolvedValue([meal(500)]);
    source.getExercise.mockResolvedValue([
      { id: "e1", logDate: today, loggedAt: new Date().toISOString(), name: "Run", durationMin: 30, intensity: "high", calories: 300, source: "manual" },
    ]);
    renderHome();
    expect(await screen.findByText("+300 burned")).toBeTruthy();
    expect(screen.getByLabelText("Calories left").textContent).toContain("1,800");
  });

  it("sends an account with no saved profile to setup", async () => {
    source.getProfile.mockResolvedValue(null);
    renderHome();
    await screen.findByLabelText("Loading");
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/onboarding"));
  });

  it("shows a retry state when the log cannot be loaded", async () => {
    source.getMeals.mockRejectedValue(new Error("network"));
    renderHome();
    expect(await screen.findByText("Couldn't load your log")).toBeTruthy();
  });
});

describe("Home burned calories with Apple Health", () => {
  it("does not count a Health workout twice: active energy already includes it, manual workouts add on top", async () => {
    source.getProfile.mockResolvedValue({ ...profile, addBurnedCalories: true });
    source.getActivity.mockResolvedValue([{ logDate: today, steps: 8000, activeKcal: 500 }]);
    source.getExercise.mockResolvedValue([
      { id: "h1", logDate: today, loggedAt: new Date().toISOString(), name: "Run", durationMin: 30, intensity: null, calories: 300, source: "shortcut" },
      { id: "m1", logDate: today, loggedAt: new Date().toISOString(), name: "Swim", durationMin: 20, intensity: null, calories: 100, source: "manual" },
    ]);
    renderHome();
    expect(await screen.findByText("+600 burned")).toBeTruthy();
    expect(screen.getByLabelText("Calories left").textContent).toContain("2,600");
  });
});
