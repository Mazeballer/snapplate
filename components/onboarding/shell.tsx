"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/**
 * The frame around every setup question: a back button and progress bar on top, the question in
 * the middle, and a Continue button pinned to the bottom, like the reference app's onboarding.
 */
export function OnboardingShell({
  progress,
  onBack,
  canGoBack,
  children,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  continuePending = false,
  hideFooter = false,
}: {
  /** From 0 to 1. */
  progress: number;
  onBack: () => void;
  canGoBack: boolean;
  children: ReactNode;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continuePending?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Back"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] transition-opacity active:bg-foreground/10 disabled:opacity-0"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>
        <span className="size-[45px] shrink-0" aria-hidden />
      </header>

      <main className="flex flex-1 flex-col px-5 pt-5 pb-6">{children}</main>

      {!hideFooter ? (
        <footer className="sticky bottom-0 border-t bg-card px-6 pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-full text-[17px] font-semibold"
            onClick={onContinue}
            disabled={continueDisabled || continuePending}
          >
            {continuePending ? "Saving…" : continueLabel}
          </Button>
        </footer>
      ) : null}
    </div>
  );
}

/** The big bold question and its short explanation. */
export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-[32px] leading-[37px] font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-[15px] leading-snug text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
