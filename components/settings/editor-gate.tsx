"use client";

import { CloudOff, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/snapplate/empty-state";
import { Button } from "@/components/ui/button";
import { useProfileEditor } from "@/hooks/use-profile-editor";
import type { LogDate } from "@/lib/time";
import type { Profile } from "@/lib/types";

type Editor = ReturnType<typeof useProfileEditor>;
export type ReadyEditor = Omit<Editor, "profile" | "today"> & { profile: Profile; today: LogDate };

/** Shows loading, error and "set up first" states, and otherwise hands over a ready editor. */
export function EditorGate({ children }: { children: (editor: ReadyEditor) => ReactNode }) {
  const editor = useProfileEditor();

  if (editor.isError) {
    return (
      <EmptyState icon={CloudOff} title="Couldn't load your profile">
        Check your connection and try again.
      </EmptyState>
    );
  }
  if (editor.isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
        <div className="h-20 animate-pulse rounded-[18px] bg-muted" />
        <div className="h-56 animate-pulse rounded-[18px] bg-muted" />
      </div>
    );
  }
  if (!editor.profile || !editor.today) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState icon={UserRound} title="Set up your plan first">
          Your details aren&apos;t saved yet.
        </EmptyState>
        <Button size="lg" nativeButton={false} render={<Link href="/onboarding" />} className="h-12 rounded-full">
          Start setup
        </Button>
      </div>
    );
  }
  return <>{children({ ...editor, profile: editor.profile, today: editor.today })}</>;
}
