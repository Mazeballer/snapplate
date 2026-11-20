"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataSource, type SaveProfileInput } from "@/lib/data";
import type { LogDate } from "@/lib/time";
import type { ExerciseInput, MealInput, SavedMealInput } from "@/lib/types";

/** Things that only change when this app changes them: kept longer, and refreshed by the mutations. */
const RARELY_CHANGES_MS = 5 * 60_000;

export const profileQuery = { queryKey: ["profile"], queryFn: () => dataSource.getProfile(), staleTime: RARELY_CHANGES_MS } as const;
export const weightsQuery = { queryKey: ["weights"], queryFn: () => dataSource.getWeightLogs(), staleTime: RARELY_CHANGES_MS } as const;

export function useProfile() {
  return useQuery(profileQuery);
}

/** Meals between two log dates. Pass null until the dates are known (they depend on "today"). */
export function useMeals(from: LogDate | null, to: LogDate | null) {
  return useQuery({
    queryKey: ["meals", from, to],
    queryFn: () => dataSource.getMeals(from!, to!),
    enabled: from !== null && to !== null,
  });
}

export function useWeightLogs() {
  return useQuery(weightsQuery);
}

export function useWater(from: LogDate | null, to: LogDate | null) {
  return useQuery({
    queryKey: ["water", from, to],
    queryFn: () => dataSource.getWater(from!, to!),
    enabled: from !== null && to !== null,
  });
}

export function useActivity(from: LogDate | null, to: LogDate | null) {
  return useQuery({
    queryKey: ["activity", from, to],
    queryFn: () => dataSource.getActivity(from!, to!),
    enabled: from !== null && to !== null,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveProfileInput) => dataSource.saveProfile(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["weights"] }),
      ]);
    },
  });
}

export function useSavedMeals() {
  return useQuery({ queryKey: ["saved-meals"], queryFn: () => dataSource.getSavedMeals(), staleTime: RARELY_CHANGES_MS });
}

export function useExercise(from: LogDate | null, to: LogDate | null) {
  return useQuery({
    queryKey: ["exercise", from, to],
    queryFn: () => dataSource.getExercise(from!, to!),
    enabled: from !== null && to !== null,
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MealInput) => dataSource.addMeal(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MealInput }) => dataSource.updateMeal(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useSaveFavourite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedMealInput) => dataSource.saveFavourite(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-meals"] }),
  });
}

export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataSource.deleteSavedMeal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-meals"] }),
  });
}

export function useAddExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseInput) => dataSource.addExercise(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercise"] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataSource.deleteExercise(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exercise"] }),
  });
}

export function useAddWater() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountMl: number) => dataSource.addWater(amountMl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["water"] }),
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataSource.deleteMeal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] }),
  });
}

export function useHealthSync() {
  return useQuery({ queryKey: ["health-sync"], queryFn: () => dataSource.getHealthSync() });
}

export function useCreateHealthToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dataSource.createHealthToken(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-sync"] }),
  });
}

export function useRevokeHealthToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dataSource.revokeHealthToken(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["health-sync"] }),
  });
}
