"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** The frame for a full-screen logging flow: back button, title, content, and a pinned action. */
export function LogPage({
  title,
  children,
  footer,
  onBack,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <header className="flex items-center gap-3 px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          aria-label="Back"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] active:bg-foreground/10"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-6">{children}</main>
      {footer ? (
        <footer className="sticky bottom-0 border-t bg-card px-6 pt-[15px] pb-[calc(15px+env(safe-area-inset-bottom))]">{footer}</footer>
      ) : null}
    </div>
  );
}

export function LogFallback() {
  return <div className="min-h-dvh" aria-busy="true" />;
}
