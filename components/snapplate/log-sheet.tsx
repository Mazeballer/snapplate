"use client";

import {
  Bookmark,
  Camera,
  Dumbbell,
  Droplet,
  PencilLine,
  Scale,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSelectedDate } from "@/components/snapplate/selected-date";
import { WeightForm } from "@/components/snapplate/weight-sheet";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAddWater } from "@/hooks/use-data";
import { GLASS_ML } from "@/lib/constants";
import { formatWater } from "@/lib/format";

interface LogOption {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const FOOD_OPTIONS: LogOption[] = [
  { id: "scan", label: "Scan food", hint: "Snap a photo", icon: Camera },
  { id: "describe", label: "Describe", hint: "Type what you ate", icon: TextCursorInput },
  { id: "manual", label: "Add manually", hint: "Enter the numbers", icon: PencilLine },
  { id: "saved", label: "Saved meals", hint: "Log a favourite", icon: Bookmark },
];

const TRACK_OPTIONS: LogOption[] = [
  { id: "water", label: "Water", hint: "Log a drink", icon: Droplet },
  { id: "weight", label: "Weight", hint: "Weigh in", icon: Scale },
  { id: "exercise", label: "Exercise", hint: "Log a workout", icon: Dumbbell },
];

const WATER_AMOUNTS = [
  { ml: GLASS_ML, label: "Glass" },
  { ml: GLASS_ML * 2, label: "Bottle" },
  { ml: GLASS_ML * 3, label: "Large bottle" },
];

function OptionButton({ option, onSelect }: { option: LogOption; onSelect: (id: string) => void }) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className="flex min-h-24 flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
    >
      <Icon className="size-6" aria-hidden />
      <span className="flex flex-col">
        <span className="text-[0.95rem] font-semibold leading-tight">{option.label}</span>
        <span className="text-xs text-muted-foreground">{option.hint}</span>
      </span>
    </button>
  );
}

function WaterView({ onDone }: { onDone: () => void }) {
  const addWater = useAddWater();
  const [custom, setCustom] = useState("");

  function add(ml: number) {
    addWater.mutate(ml, {
      onSuccess: () => {
        toast.success(`Added ${formatWater(ml)} of water`);
        onDone();
      },
      onError: () => toast.error("Couldn't log water. Please try again."),
    });
  }

  const customMl = Number(custom);
  const customValid = Number.isInteger(customMl) && customMl >= 10 && customMl <= 5000;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {WATER_AMOUNTS.map((a) => (
          <button
            key={a.ml}
            type="button"
            disabled={addWater.isPending}
            onClick={() => add(a.ml)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-5 transition-colors active:bg-muted disabled:opacity-60"
          >
            <Droplet className="size-6" style={{ color: "var(--fat)" }} aria-hidden />
            <span className="text-lg font-semibold tabular-nums">{a.ml} ml</span>
            <span className="text-xs text-muted-foreground">{a.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
          placeholder="Other amount (ml)"
          aria-label="Other amount in millilitres"
          className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-foreground"
        />
        <Button size="lg" className="h-12 rounded-xl px-6" disabled={!customValid || addWater.isPending} onClick={() => add(customMl)}>
          Add
        </Button>
      </div>
    </div>
  );
}

type View = "menu" | "water" | "weight";

const TITLES: Record<View, { title: string; description: string }> = {
  menu: { title: "Log", description: "What would you like to add?" },
  water: { title: "Water", description: "How much did you drink?" },
  weight: { title: "Log weight", description: "Today's weigh-in" },
};

export function LogSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { picked } = useSelectedDate();
  const [view, setView] = useState<View>("menu");

  const close = () => onOpenChange(false);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setView("menu"); // start from the menu next time
  }

  function handleSelect(id: string) {
    if (id === "water" || id === "weight") {
      setView(id);
      return;
    }
    close();
    // Entries are recorded on the day being viewed on Home.
    router.push(picked ? `/log/${id}?date=${picked}` : `/log/${id}`);
  }

  const { title, description } = TITLES[view];

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {view === "menu" ? (
            <>
              <section aria-label="Food" className="grid grid-cols-2 gap-3">
                {FOOD_OPTIONS.map((o) => (
                  <OptionButton key={o.id} option={o} onSelect={handleSelect} />
                ))}
              </section>
              <section aria-label="Track" className="grid grid-cols-3 gap-3">
                {TRACK_OPTIONS.map((o) => (
                  <OptionButton key={o.id} option={o} onSelect={handleSelect} />
                ))}
              </section>
            </>
          ) : null}
          {view === "water" ? <WaterView onDone={() => handleOpenChange(false)} /> : null}
          {view === "weight" ? <WeightForm onDone={() => handleOpenChange(false)} /> : null}
          {view !== "menu" ? (
            <Button variant="ghost" size="lg" className="rounded-full" onClick={() => setView("menu")}>
              Back
            </Button>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
