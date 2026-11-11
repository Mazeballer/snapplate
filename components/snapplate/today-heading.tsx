"use client";

import { useToday } from "@/hooks/use-today";
import { formatDate } from "@/lib/time";

/** "Today" with the Malaysia calendar date underneath. Renders after mount (see useToday). */
export function TodayHeading() {
  const today = useToday();
  if (!today) {
    return (
      <div className="h-[3.25rem]" aria-hidden>
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }
  return (
    <header className="flex flex-col">
      <h1 className="text-3xl font-semibold tracking-tight">Today</h1>
      <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
    </header>
  );
}
