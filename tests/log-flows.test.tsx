// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MealDraft } from "@/lib/types";

const replace = vi.fn();
const addMeal = vi.fn().mockResolvedValue(undefined);
const saveFavourite = vi.fn().mockResolvedValue(undefined);
const analyzeText = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/lib/data", () => ({
  dataSource: { addMeal: (...a: unknown[]) => addMeal(...a), saveFavourite: (...a: unknown[]) => saveFavourite(...a), uploadMealPhoto: vi.fn() },
}));
vi.mock("@/lib/ai/client", () => ({
  analyzeText: (...a: unknown[]) => analyzeText(...a),
  fixMeal: vi.fn(),
}));

import { DescribeScreen } from "@/components/log/describe-screen";
import { ManualScreen } from "@/components/log/manual-screen";

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const chickenRice: MealDraft = {
  name: "Chicken rice",
  emoji: "🍗",
  mealType: "lunch",
  imagePath: null,
  imagePreview: null,
  source: "text",
  aiTraceId: "trace-1",
  confidence: "high",
  calories: 500,
  proteinG: 33,
  carbsG: 56,
  fatG: 15,
  fiberG: 2,
  sugarG: 1,
  sodiumMg: 900,
  servings: 1,
  healthScore: 6.5,
  factors: [{ label: "Sodium", quality: "fair", note: "A fair amount of salt." }],
  items: [{ name: "Chicken rice", quantity: 1, unit: "bowl", calories: 500, proteinG: 33, carbsG: 56, fatG: 15 }],
};

beforeEach(() => {
  addMeal.mockClear();
  saveFavourite.mockClear();
  analyzeText.mockReset();
  replace.mockClear();
});
afterEach(cleanup);

describe("Add manually", () => {
  it("keeps the button disabled until a name and calories are entered", async () => {
    const user = userEvent.setup();
    wrap(<ManualScreen />);
    const button = await screen.findByRole("button", { name: "Add meal" });
    const disabled = () => (button as HTMLButtonElement).disabled;
    expect(disabled()).toBe(true);
    await user.type(screen.getByPlaceholderText("For example: Nasi lemak"), "Nasi lemak");
    expect(disabled()).toBe(true);
    await user.type(screen.getByLabelText("Calories in kcal"), "600");
    expect(disabled()).toBe(false);
  });

  it("saves the typed meal with a health score and returns home", async () => {
    const user = userEvent.setup();
    wrap(<ManualScreen />);
    await user.type(await screen.findByPlaceholderText("For example: Nasi lemak"), "Nasi lemak");
    await user.type(screen.getByLabelText("Calories in kcal"), "600");
    await user.type(screen.getByLabelText("Protein in g"), "20");
    await user.type(screen.getByLabelText("Carbs in g"), "66");
    await user.type(screen.getByLabelText("Fat in g"), "31");
    await user.click(screen.getByRole("button", { name: "Add meal" }));

    await waitFor(() => expect(addMeal).toHaveBeenCalledTimes(1));
    const saved = addMeal.mock.calls[0]![0];
    expect(saved).toMatchObject({ name: "Nasi lemak", calories: 600, proteinG: 20, carbsG: 66, fatG: 31, servings: 1, source: "manual" });
    expect(saved.healthScore).toBeGreaterThanOrEqual(0);
    expect(typeof saved.loggedAt).toBe("string");
    expect(saveFavourite).not.toHaveBeenCalled();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("also saves a favourite when asked", async () => {
    const user = userEvent.setup();
    wrap(<ManualScreen />);
    await user.type(await screen.findByPlaceholderText("For example: Nasi lemak"), "Teh tarik");
    await user.type(screen.getByLabelText("Calories in kcal"), "130");
    await user.click(screen.getByRole("switch", { name: "Save to my meals" }));
    await user.click(screen.getByRole("button", { name: "Add meal" }));
    await waitFor(() => expect(saveFavourite).toHaveBeenCalledTimes(1));
    expect(saveFavourite.mock.calls[0]![0]).toMatchObject({ name: "Teh tarik", calories: 130 });
  });
});

describe("Describe", () => {
  it("estimates, lets you change servings, and saves the scaled meal", async () => {
    analyzeText.mockResolvedValue({ ok: true, value: chickenRice });
    const user = userEvent.setup();
    wrap(<DescribeScreen />);

    await user.type(await screen.findByLabelText("Describe what you ate"), "chicken rice one bowl");
    await user.click(screen.getByRole("button", { name: /Estimate/ }));

    expect(await screen.findByDisplayValue("Chicken rice")).toBeTruthy();
    expect(screen.getByText("500")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "More servings" }));
    expect(screen.getByText("750")).toBeTruthy(); // 500 kcal x 1.5 servings

    await user.click(screen.getByRole("button", { name: "Add meal" }));
    await waitFor(() => expect(addMeal).toHaveBeenCalledTimes(1));
    const saved = addMeal.mock.calls[0]![0];
    expect(saved).toMatchObject({ name: "Chicken rice", calories: 750, servings: 1.5, source: "text", aiTraceId: "trace-1" });
    expect(saved.items[0]).toMatchObject({ quantity: 1.5, calories: 750 });
    expect(saveFavourite).not.toHaveBeenCalled();
  });

  it("saves a favourite at one serving's nutrition", async () => {
    analyzeText.mockResolvedValue({ ok: true, value: chickenRice });
    const user = userEvent.setup();
    wrap(<DescribeScreen />);
    await user.type(await screen.findByLabelText("Describe what you ate"), "chicken rice");
    await user.click(screen.getByRole("button", { name: /Estimate/ }));
    await screen.findByDisplayValue("Chicken rice");
    await user.click(screen.getByRole("button", { name: "More servings" }));
    await user.click(screen.getByRole("switch", { name: "Save to my meals" }));
    await user.click(screen.getByRole("button", { name: "Add meal" }));
    await waitFor(() => expect(saveFavourite).toHaveBeenCalledTimes(1));
    expect(saveFavourite.mock.calls[0]![0]).toMatchObject({ name: "Chicken rice", calories: 500 });
  });

  it("explains when the text is not food and keeps what was typed", async () => {
    analyzeText.mockResolvedValue({ ok: false, error: "not_food" });
    const user = userEvent.setup();
    wrap(<DescribeScreen />);
    await user.type(await screen.findByLabelText("Describe what you ate"), "my keyboard");
    await user.click(screen.getByRole("button", { name: /Estimate/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't find any food/i);
    expect((screen.getByLabelText("Describe what you ate") as HTMLTextAreaElement).value).toBe("my keyboard");
    expect(addMeal).not.toHaveBeenCalled();
  });
});
