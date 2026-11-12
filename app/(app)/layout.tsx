import { Suspense, type ReactNode } from "react";
import { AuthGate } from "@/components/snapplate/auth-gate";
import { SelectedDateProvider } from "@/components/snapplate/selected-date";
import { TabBar } from "@/components/snapplate/tab-bar";

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
      <div className="h-24 animate-pulse rounded-3xl bg-muted" />
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SelectedDateProvider>
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex flex-1 flex-col px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {/* The session is read at request time, so the app streams in behind this boundary. */}
        <Suspense fallback={<PageSkeleton />}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
      <TabBar />
    </div>
    </SelectedDateProvider>
  );
}
