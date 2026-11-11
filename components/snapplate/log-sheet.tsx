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
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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

function OptionButton({ option, onSelect }: { option: LogOption; onSelect: (id: string) => void }) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(option.id)}
      className="flex min-h-24 flex-col items-start justify-between gap-3 rounded-2xl bg-muted p-4 text-left transition-colors active:bg-muted/60"
    >
      <Icon className="size-6" aria-hidden />
      <span className="flex flex-col">
        <span className="text-[0.95rem] font-semibold leading-tight">{option.label}</span>
        <span className="text-xs text-muted-foreground">{option.hint}</span>
      </span>
    </button>
  );
}

export function LogSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Each option gets a real destination as its feature is built.
  const handleSelect = (id: string) => {
    onOpenChange(false);
    toast("Coming soon", { description: `“${id}” is not built yet.` });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">Log</DrawerTitle>
          <DrawerDescription>What would you like to add?</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
