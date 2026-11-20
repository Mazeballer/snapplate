// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Meal, MealDraft } from "@/lib/types";

const updateMeal = vi.fn().mockResolvedValue(undefined);
const fixMeal = vi.fn();
const onOpenChange = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/lib/data", () => ({
  dataSource: {
    updateMeal: (...a: unknown[]) => updateMeal(...a),
    deleteMeal: vi.fn(),
    saveFavourite: vi.fn(),
  },
}));
vi.mock("@/lib/ai/client", () => ({ fixMeal: (...a: unknown[]) => fixMeal(...a) }));

import { MealDetailDrawer } from "@/components/snapplate/meal-detail-drawer";

// Two servings of 300 kcal each were logged, so the stored total is 600.
const meal: Meal = {
  id: "meal-1",
  loggedAt: "2026-11-12T04:30:00.000Z",
  logDate: "2026-11-12",
  mealType: "lunch",
  name: "Fried rice",
  emoji: "🍚",
  imageUrl: null,
  calories: 600,
  proteinG: 20,
  carbsG: 80,
  fatG: 20,
  fiberG: null,
  sugarG: null,
  sodiumMg: null,
  servings: 2,
  healthScore: 5,
  factors: [],
  source: "text",
  items: [{ id: "i1", name: "Rice", quantity: 2, unit: "cup", calories: 600, proteinG: 20, carbsG: 80, fatG: 20 }],
};

const fixed: MealDraft = {
  name: "Fried rice with egg",
  emoji: "🍳",
  mealType: "dinner",
  imagePath: null,
  imagePreview: null,
  source: "text",
  aiTraceId: "t2",
  confidence: "high",
  calories: 450,
  proteinG: 18,
  carbsG: 55,
  fatG: 16,
  fiberG: null,
  sugarG: null,
  sodiumMg: null,
  servings: 3,
  healthScore: 6,
  factors: [],
  items: [{ name: "Fried rice", quantity: 1, unit: "plate", calories: 450, proteinG: 18, carbsG: 55, fatG: 16 }],
};

function renderDrawer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MealDetailDrawer meal={meal} open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  updateMeal.mockClear();
  fixMeal.mockReset();
  onOpenChange.mockClear();
});
afterEach(cleanup);

describe("Fix Results on a logged meal", () => {
  it("re-estimates from the correction and updates the meal, keeping its time and meal type", async () => {
    fixMeal.mockResolvedValue({ ok: true, value: fixed });
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole("button", { name: /fix results/i }));
    await user.type(await screen.findByLabelText("What needs fixing"), "there was an egg on top");
    await user.click(screen.getByRole("button", { name: "Update estimate" }));

    await waitFor(() => expect(updateMeal).toHaveBeenCalledTimes(1));

    // The AI was given the meal per serving (600 kcal over 2 servings = 300), plus the correction.
    const [draftSent, correction] = fixMeal.mock.calls[0]!;
    expect(correction).toBe("there was an egg on top");
    expect(draftSent.calories).toBe(300);
    expect(draftSent.servings).toBe(2);

    const [id, input] = updateMeal.mock.calls[0]!;
    expect(id).toBe("meal-1");
    expect(input.name).toBe("Fried rice with egg");
    expect(input.calories).toBe(450); // one serving of the new estimate
    expect(input.servings).toBe(1);
    expect(input.mealType).toBe("lunch"); // not changed to the AI's guess of dinner
    expect(input.loggedAt).toBe(meal.loggedAt);
    expect(input.items).toHaveLength(1);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("leaves the meal alone when the estimate fails", async () => {
    fixMeal.mockResolvedValue({ ok: false, error: "unavailable" });
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole("button", { name: /fix results/i }));
    await user.type(await screen.findByLabelText("What needs fixing"), "it was a small portion");
    await user.click(screen.getByRole("button", { name: "Update estimate" }));

    await waitFor(() => expect(fixMeal).toHaveBeenCalled());
    expect(updateMeal).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
