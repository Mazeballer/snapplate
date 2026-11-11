import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-muted/60 px-6 py-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-background">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children ? <p className="max-w-64 text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}
