"use client";

import { Bookmark, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HealthPanel } from "@/components/snapplate/health-panel";
import { CaloriesCard, MacroCards, MoreNutrition } from "@/components/snapplate/meal-facts";
import { MealThumb } from "@/components/snapplate/meal-row";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useDeleteMeal, useSaveFavourite } from "@/hooks/use-data";
import { savedFromMeal } from "@/lib/meal";
import { formatNumber } from "@/lib/format";
import { formatClockTime, formatDate } from "@/lib/time";
import type { Meal } from "@/lib/types";

export function MealDetailDrawer({
  meal,
  open,
  onOpenChange,
}: {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteMeal = useDeleteMeal();
  const saveFavourite = useSaveFavourite();

  function handleDelete() {
    if (!meal) return;
    deleteMeal.mutate(meal.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Meal deleted");
      },
      onError: () => toast.error("Couldn't delete that meal. Please try again."),
    });
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        {meal ? (
          <>
            <DrawerHeader className="flex-row items-center gap-3 pt-2 pb-3 text-left">
              <MealThumb meal={meal} className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl" />
              <div className="min-w-0">
                <DrawerTitle className="text-[20px] leading-tight font-bold">{meal.name}</DrawerTitle>
                <DrawerDescription>
                  {formatDate(meal.logDate)} · {formatClockTime(meal.loggedAt)}
                </DrawerDescription>
              </div>
            </DrawerHeader>

            <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <CaloriesCard calories={meal.calories} />
              <MacroCards proteinG={meal.proteinG} carbsG={meal.carbsG} fatG={meal.fatG} />

              {meal.healthScore !== null ? <HealthPanel score={meal.healthScore} factors={meal.factors} /> : null}

              {meal.items.length > 0 ? (
                <section className="flex flex-col gap-2" aria-label="Ingredients">
                  <h3 className="text-lg font-bold">Ingredients</h3>
                  <ul className="flex flex-col divide-y divide-border rounded-[15px] border-[1.5px] border-input bg-card px-4">
                    {meal.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit ?? ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                          {formatNumber(item.calories)} kcal
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <MoreNutrition fiberG={meal.fiberG} sugarG={meal.sugarG} sodiumMg={meal.sodiumMg} />

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 gap-2 rounded-full border-[1.5px] border-input"
                disabled={saveFavourite.isPending}
                onClick={() =>
                  saveFavourite.mutate(savedFromMeal(meal), {
                    onSuccess: () => toast.success("Saved to your meals"),
                    onError: () => toast.error("Couldn't save it. Please try again."),
                  })
                }
              >
                <Bookmark aria-hidden />
                Save to my meals
              </Button>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 border-[1.5px] border-input"
                  onClick={() => toast("Coming soon", { description: "Fixing a result with AI is not built yet." })}
                >
                  <Sparkles aria-hidden />
                  Fix Results
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleDelete}
                  disabled={deleteMeal.isPending}
                >
                  <Trash2 aria-hidden />
                  {deleteMeal.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
