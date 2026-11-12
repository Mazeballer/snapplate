"use client";

import { Bookmark, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HealthPanel } from "@/components/snapplate/health-panel";
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

function Macro({ label, value, colorVar }: { label: string; value: number; colorVar: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl bg-card border border-border py-3">
      <span className="text-lg font-semibold tabular-nums">{Math.round(value)}g</span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden />
        {label}
      </span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col rounded-2xl bg-card border border-border px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

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
            <DrawerHeader className="flex-row items-center gap-3 pt-2 text-left">
              <MealThumb meal={meal} className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl" />
              <div className="min-w-0">
                <DrawerTitle className="text-xl leading-tight font-semibold">{meal.name}</DrawerTitle>
                <DrawerDescription>
                  {formatDate(meal.logDate)} · {formatClockTime(meal.loggedAt)}
                </DrawerDescription>
              </div>
            </DrawerHeader>

            <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-center gap-1.5 pt-1">
                <span className="text-5xl font-semibold tracking-tight tabular-nums">
                  {formatNumber(meal.calories)}
                </span>
                <span className="text-muted-foreground">calories</span>
              </div>

              <div className="flex gap-2">
                <Macro label="Protein" value={meal.proteinG} colorVar="--protein" />
                <Macro label="Carbs" value={meal.carbsG} colorVar="--carbs" />
                <Macro label="Fat" value={meal.fatG} colorVar="--fat" />
              </div>

              {meal.fiberG !== null || meal.sugarG !== null || meal.sodiumMg !== null ? (
                <div className="flex gap-2">
                  {meal.fiberG !== null ? <Fact label="Fibre" value={`${Math.round(meal.fiberG)}g`} /> : null}
                  {meal.sugarG !== null ? <Fact label="Sugar" value={`${Math.round(meal.sugarG)}g`} /> : null}
                  {meal.sodiumMg !== null ? <Fact label="Sodium" value={`${formatNumber(meal.sodiumMg)}mg`} /> : null}
                </div>
              ) : null}

              {meal.healthScore !== null ? <HealthPanel score={meal.healthScore} factors={meal.factors} /> : null}

              {meal.items.length > 0 ? (
                <section className="flex flex-col gap-2" aria-label="Ingredients">
                  <h3 className="font-semibold">Ingredients</h3>
                  <ul className="flex flex-col divide-y divide-border rounded-2xl bg-card border border-border px-4">
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

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-12 gap-2 rounded-full"
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
                  className="flex-1 gap-2"
                  onClick={() => toast("Coming soon", { description: "Fixing a result with AI is not built yet." })}
                >
                  <Pencil aria-hidden />
                  Fix result
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
