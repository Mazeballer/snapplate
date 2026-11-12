"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataSource, type SaveProfileInput } from "@/lib/data";
import type { LogDate } from "@/lib/time";
import type { ExerciseInput, MealInput, SavedMealInput } from "@/lib/types";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: () => dataSource.getProfile() });
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
  return useQuery({ queryKey: ["weights"], queryFn: () => dataSource.getWeightLogs() });
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
  return useQuery({ queryKey: ["saved-meals"], queryFn: () => dataSource.getSavedMeals() });
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
