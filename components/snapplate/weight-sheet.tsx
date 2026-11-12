"use client";

import { useState } from "react";
import { toast } from "sonner";
import { WeightPicker } from "@/components/snapplate/pickers";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useProfile, useSaveProfile } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { updateProfile } from "@/lib/plan";

/** The weigh-in form: pick a weight and log it for today. Also updates your plan's targets. */
export function WeightForm({ onDone }: { onDone: () => void }) {
  const { data: profile } = useProfile();
  const today = useToday();
  const save = useSaveProfile();
  const [kg, setKg] = useState<number | null>(null);

  if (!profile || !today) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Set up your plan first to log your weight.</p>;
  }

  const value = kg ?? profile.weightKg ?? 70;

  return (
    <div className="flex flex-col gap-5">
      <WeightPicker units={profile.units} weightKg={value} onChange={setKg} label="Weight" />
      <Button
        size="lg"
        className="h-12 rounded-full text-base font-semibold"
        disabled={save.isPending}
        onClick={() =>
          save.mutate(
            // The new weight also moves your daily targets, unless you set them yourself.
            { profile: updateProfile(profile, { weightKg: value }, today), weightLog: { logDate: today, weightKg: value } },
            {
              onSuccess: () => {
                toast.success("Weight logged");
                onDone();
              },
              onError: () => toast.error("Couldn't save your weight. Please try again."),
            },
          )
        }
      >
        {save.isPending ? "Saving…" : "Log weight"}
      </Button>
    </div>
  );
}

export function WeightSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">Log weight</DrawerTitle>
          <DrawerDescription>Today&apos;s weigh-in</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <WeightForm onDone={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
