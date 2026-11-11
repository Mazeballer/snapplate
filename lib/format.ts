import { kgToLb, round1 } from "./nutrition";
import type { Units } from "./types";

const numberFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** 2137 -> "2,137". Rounds to a whole number. */
export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

/** 85.4 -> "85". Grams are shown whole. */
export const formatGrams = (value: number): string => `${formatNumber(value)}g`;

/** A weight in the user's units, e.g. "78.2 kg" or "172.4 lb". */
export function formatWeight(kg: number, units: Units): string {
  return units === "imperial" ? `${round1(kgToLb(kg))} lb` : `${round1(kg)} kg`;
}

/** The unit label only, "kg" or "lb". */
export const weightUnit = (units: Units): string => (units === "imperial" ? "lb" : "kg");

/** The number in the user's units, rounded to one decimal. */
export const weightValue = (kg: number, units: Units): number =>
  round1(units === "imperial" ? kgToLb(kg) : kg);

/** A signed change, e.g. "-1.6 kg" or "+0.4 kg". */
export function formatWeightChange(deltaKg: number, units: Units): string {
  const value = weightValue(Math.abs(deltaKg), units);
  const sign = deltaKg < 0 ? "-" : deltaKg > 0 ? "+" : "";
  return `${sign}${value} ${weightUnit(units)}`;
}

/** Millilitres as litres once they pass a litre: 1250 -> "1.25 L", 500 -> "500 ml". */
export function formatWater(ml: number): string {
  if (ml >= 1000) return `${Math.round(ml / 10) / 100} L`;
  return `${Math.round(ml)} ml`;
}
