"use client";

import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/** The page frame for a Settings sub-screen: a back button and a title. */
export function SettingsPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href="/settings"
          aria-label="Back to settings"
          className="flex size-[45px] shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] active:bg-foreground/10"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </header>
      {children}
    </div>
  );
}

/** A white card holding rows separated by thin lines, with an optional small heading above. */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2> : null}
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  icon?: LucideIcon;
  label: string;
  value?: ReactNode;
  disabled?: boolean;
  badge?: string;
}

function RowContent({ icon: Icon, label, value, badge, chevron }: RowProps & { chevron?: boolean }) {
  return (
    <>
      {Icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
          <Icon className="size-[18px]" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-[0.95rem] font-medium">{label}</span>
      {badge ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{badge}</span> : null}
      {value !== undefined ? <span className="max-w-[45%] truncate text-sm text-muted-foreground">{value}</span> : null}
      {chevron ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
    </>
  );
}

const rowClass = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted";

/** A row that opens a sheet or runs an action. */
export function SettingsButtonRow({ onClick, disabled, ...rest }: RowProps & { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn(rowClass, disabled && "opacity-50")}>
      <RowContent {...rest} chevron />
    </button>
  );
}

/** A row that goes to another page. */
export function SettingsLinkRow({ href, ...rest }: RowProps & { href: string }) {
  return (
    <Link href={href} className={rowClass}>
      <RowContent {...rest} chevron />
    </Link>
  );
}

/** A row with a control (a switch, a segmented choice) instead of a chevron. */
export function SettingsControlRow({
  icon,
  label,
  description,
  control,
}: {
  icon?: LucideIcon;
  label: string;
  description?: string;
  control: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      {Icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background">
          <Icon className="size-[18px]" aria-hidden />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-medium">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground">{description}</span> : null}
      </span>
      {control}
    </div>
  );
}

function SheetBody<T>({
  initial,
  canSave,
  onCommit,
  onClose,
  children,
  saveLabel,
}: {
  initial: T;
  canSave?: (value: T) => boolean;
  onCommit: (value: T) => void;
  onClose: () => void;
  children: (value: T, setValue: (value: T) => void) => ReactNode;
  saveLabel: string;
}) {
  // Mounted only while the sheet is open, so it always starts from the current saved value.
  const [value, setValue] = useState<T>(initial);
  return (
    <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {children(value, setValue)}
      <Button
        size="lg"
        className="h-12 rounded-full text-base font-semibold"
        disabled={canSave ? !canSave(value) : false}
        onClick={() => {
          onCommit(value);
          onClose();
        }}
      >
        {saveLabel}
      </Button>
    </div>
  );
}

/**
 * A bottom sheet for editing one value. The editing UI is given as a function of the working
 * value; nothing is saved until the person taps the button.
 */
export function FieldSheet<T>({
  open,
  onOpenChange,
  title,
  description,
  initial,
  onCommit,
  canSave,
  saveLabel = "Save",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  initial: T;
  onCommit: (value: T) => void;
  canSave?: (value: T) => boolean;
  saveLabel?: string;
  children: (value: T, setValue: (value: T) => void) => ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader className="pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        <SheetBody
          initial={initial}
          canSave={canSave}
          onCommit={onCommit}
          onClose={() => onOpenChange(false)}
          saveLabel={saveLabel}
        >
          {children}
        </SheetBody>
      </DrawerContent>
    </Drawer>
  );
}
