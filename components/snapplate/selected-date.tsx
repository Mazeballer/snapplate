"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { LogDate } from "@/lib/time";

interface SelectedDate {
  /** The day picked on the week strip, or null to follow today. */
  picked: LogDate | null;
  setPicked: (date: LogDate | null) => void;
}

const SelectedDateContext = createContext<SelectedDate | null>(null);

/** Shares the day being viewed between Home and the + sheet, so new entries land on that day. */
export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<LogDate | null>(null);
  const value = useMemo(() => ({ picked, setPicked }), [picked]);
  return <SelectedDateContext value={value}>{children}</SelectedDateContext>;
}

export function useSelectedDate(): SelectedDate {
  const context = useContext(SelectedDateContext);
  if (!context) throw new Error("useSelectedDate must be used inside SelectedDateProvider");
  return context;
}
