"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useProfile, useSaveProfile } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { updateProfile } from "@/lib/plan";
import type { Profile, WeightLog } from "@/lib/types";

/**
 * What the Settings screens use to edit the saved profile. `change` applies edits (recalculating
 * targets when the edit affects them) and saves, optionally recording a weigh-in too.
 */
export function useProfileEditor() {
  const query = useProfile();
  const today = useToday();
  const mutation = useSaveProfile();

  const persist = useCallback(
    (next: Profile, weightLog?: WeightLog) => {
      mutation.mutate(
        { profile: next, weightLog },
        {
          onSuccess: () => toast.success("Saved"),
          onError: () => toast.error("Couldn't save that. Please try again."),
        },
      );
    },
    [mutation],
  );

  const change = useCallback(
    (changes: Partial<Profile>, weightLog?: WeightLog) => {
      const profile = query.data;
      if (!profile || !today) return;
      persist(updateProfile(profile, changes, today), weightLog);
    },
    [query.data, today, persist],
  );

  /** Save a profile that has already been built (for example after Auto-generate). */
  const replace = useCallback((next: Profile) => persist(next), [persist]);

  return {
    profile: query.data ?? null,
    isPending: query.isPending || !today,
    isError: query.isError,
    today,
    saving: mutation.isPending,
    change,
    replace,
  };
}
