"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAddExercise, useAddMeal, useSaveFavourite } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { dataSource } from "@/lib/data";
import { finalizeMeal, loggedAtFor, savedFromDraft } from "@/lib/meal";
import { isLogDate, type LogDate } from "@/lib/time";
import type { ExerciseInput, MealDraft } from "@/lib/types";

/** The day an entry is being logged for: ?date= from Home when another day is selected, else today. */
export function useLogDate(): LogDate | null {
  const today = useToday();
  const requested = useSearchParams().get("date");
  if (!today) return null;
  return requested && isLogDate(requested) && requested <= today ? requested : today;
}

/** Fails a step that never finishes, so the Save button can't sit on "Saving…" forever. */
function withTimeout<T>(label: string, promise: Promise<T>, ms = 30_000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} took too long`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function reason(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/** Saves a reviewed meal (uploading its photo first, if any), then returns to Home. */
export function useSaveMeal(logDate: LogDate | null) {
  const router = useRouter();
  const addMeal = useAddMeal();
  const saveFavourite = useSaveFavourite();
  const [saving, setSaving] = useState(false);

  async function save(draft: MealDraft, options: { favourite: boolean; photo?: Blob | null }) {
    if (!logDate) return;
    setSaving(true);
    try {
      const imagePath = options.photo ? await withTimeout("Uploading the photo", dataSource.uploadMealPhoto(options.photo)) : draft.imagePath;
      await withTimeout("Saving the meal", addMeal.mutateAsync(finalizeMeal({ ...draft, imagePath }, loggedAtFor(logDate))));
      if (options.favourite) await withTimeout("Saving to your meals", saveFavourite.mutateAsync(savedFromDraft(draft)));
      toast.success("Meal added");
      router.replace("/");
    } catch (error) {
      console.error("[save meal]", error);
      toast.error(`Couldn't save the meal: ${reason(error)}`);
      setSaving(false);
    }
  }

  return { save, saving };
}

/** Saves a workout, then returns to Home. */
export function useSaveExercise(logDate: LogDate | null) {
  const router = useRouter();
  const addExercise = useAddExercise();
  const [saving, setSaving] = useState(false);

  async function save(input: ExerciseInput) {
    if (!logDate) return;
    setSaving(true);
    try {
      await addExercise.mutateAsync({ ...input, loggedAt: loggedAtFor(logDate) });
      toast.success("Workout added");
      router.replace("/");
    } catch {
      toast.error("Couldn't save the workout. Please try again.");
      setSaving(false);
    }
  }

  return { save, saving };
}
