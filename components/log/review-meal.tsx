"use client";

import { Minus, Pencil, Plus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { HealthPanel } from "@/components/snapplate/health-panel";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";
import { draftTotals, stepServings } from "@/lib/meal";
import type { MealDraft, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

function Macro({ label, value, colorVar }: { label: string; value: number; colorVar: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 rounded-2xl border border-border bg-card py-3">
      <span className="text-lg font-semibold tabular-nums">{Math.round(value)}g</span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden />
        {label}
      </span>
    </div>
  );
}

function FixSheet({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (correction: string) => void;
  pending: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">Fix result</DrawerTitle>
          <DrawerDescription>Tell us what&apos;s wrong and we&apos;ll re-estimate it.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="For example: it was two eggs, not one, and a small portion of rice"
            aria-label="What needs fixing"
            className="w-full resize-none rounded-xl border border-border bg-card p-4 text-base outline-none focus:border-foreground"
          />
          <Button
            size="lg"
            className="h-12 rounded-full text-base font-semibold"
            disabled={text.trim().length < 2 || pending}
            onClick={() => onSubmit(text.trim())}
          >
            {pending ? "Re-estimating…" : "Update estimate"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Review a meal before it is saved: rename it, pick the meal, change the portion, see the
 * nutrition and health score, and optionally have the estimate re-done or keep it as a favourite.
 */
export function ReviewMeal({
  draft,
  onChange,
  favourite,
  onFavouriteChange,
  onFix,
  showFavourite = true,
}: {
  draft: MealDraft;
  onChange: (draft: MealDraft) => void;
  favourite: boolean;
  onFavouriteChange: (value: boolean) => void;
  /** Provide to show "Fix result". Resolves true when the estimate was replaced. */
  onFix?: (correction: string) => Promise<boolean>;
  /** Hide the "Save to my meals" switch (it makes no sense for a meal that is already saved). */
  showFavourite?: boolean;
}) {
  const totals = draftTotals(draft);
  const [fixOpen, setFixOpen] = useState(false);
  const [fixing, setFixing] = useState(false);

  async function submitFix(correction: string) {
    if (!onFix) return;
    setFixing(true);
    const done = await onFix(correction);
    setFixing(false);
    if (done) {
      setFixOpen(false);
      toast.success("Estimate updated");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {draft.imagePreview ? (
        // A local preview of the photo just taken; next/image does not handle blob URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={draft.imagePreview} alt="Your meal" className="h-48 w-full rounded-[20px] object-cover" />
      ) : draft.emoji ? (
        <div className="flex h-28 items-center justify-center rounded-[20px] border border-border bg-card text-6xl" aria-hidden>
          {draft.emoji}
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">Name</span>
        <span className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 focus-within:border-foreground">
          <input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value.slice(0, 120) })}
            aria-label="Meal name"
            className="h-12 w-full min-w-0 bg-transparent text-base font-semibold outline-none"
          />
          <Pencil className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </span>
      </label>

      <div role="radiogroup" aria-label="Meal" className="grid grid-cols-4 gap-1.5">
        {MEAL_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={draft.mealType === t.value}
            onClick={() => onChange({ ...draft, mealType: t.value })}
            className={cn(
              "h-10 rounded-full text-[0.8rem] font-semibold transition-colors",
              draft.mealType === t.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
        <span className="pl-1 font-medium">Servings</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Fewer servings"
            onClick={() => onChange({ ...draft, servings: stepServings(draft.servings, -1) })}
            className="flex size-10 items-center justify-center rounded-full bg-muted active:bg-border"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-10 text-center text-lg font-semibold tabular-nums" aria-live="polite">
            {draft.servings}
          </span>
          <button
            type="button"
            aria-label="More servings"
            onClick={() => onChange({ ...draft, servings: stepServings(draft.servings, 1) })}
            className="flex size-10 items-center justify-center rounded-full bg-muted active:bg-border"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex items-baseline justify-center gap-1.5">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">{formatNumber(totals.calories)}</span>
        <span className="text-muted-foreground">calories</span>
      </div>
      <div className="flex gap-2">
        <Macro label="Protein" value={totals.proteinG} colorVar="--protein" />
        <Macro label="Carbs" value={totals.carbsG} colorVar="--carbs" />
        <Macro label="Fat" value={totals.fatG} colorVar="--fat" />
      </div>

      {draft.confidence === "low" ? (
        <p className="flex items-start gap-2 rounded-2xl bg-warning/20 p-3 text-sm" role="status">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          We&apos;re not very sure about this one. Check the portion and fix it if it&apos;s off.
        </p>
      ) : null}

      {draft.healthScore !== null ? <HealthPanel score={draft.healthScore} factors={draft.factors} /> : null}

      {draft.items.length > 0 ? (
        <section className="flex flex-col gap-2" aria-label="Ingredients">
          <h3 className="font-semibold">Ingredients</h3>
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-4">
            {draft.items.map((item, i) => (
              <li key={`${item.name}-${i}`} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.quantity * draft.servings * 10) / 10} {item.unit ?? ""}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {formatNumber(item.calories * draft.servings)} kcal
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showFavourite ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="pr-3">
            <span className="block font-medium">Save to my meals</span>
            <span className="block text-xs text-muted-foreground">Quickly log it again later.</span>
          </span>
          <Switch checked={favourite} onCheckedChange={onFavouriteChange} aria-label="Save to my meals" />
        </div>
      ) : null}

      {onFix ? (
        <Button variant="outline" size="lg" className="h-12 gap-2 rounded-full" onClick={() => setFixOpen(true)}>
          <Pencil aria-hidden />
          Fix result
        </Button>
      ) : null}

      {onFix ? <FixSheet open={fixOpen} onOpenChange={setFixOpen} onSubmit={submitFix} pending={fixing} /> : null}
    </div>
  );
}
