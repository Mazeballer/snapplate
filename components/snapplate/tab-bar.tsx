"use client";

import { ChartNoAxesColumn, House, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogSheet } from "@/components/snapplate/log-sheet";
import { useProfile } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function ProfileIcon({ active }: { active: boolean }) {
  const { data: profile } = useProfile();
  const initial = profile?.displayName?.trim().charAt(0).toUpperCase();
  if (!initial) return <UserRound className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden />;
  return (
    <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-[0.7rem] font-bold text-background" aria-hidden>
      {initial}
    </span>
  );
}

/**
 * The bottom bar: a floating rounded pill with Home, Progress and Profile, and a round + button
 * beside it, like the reference app.
 */
export function TabBar() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);

  const tabs = [
    { href: "/", label: "Home", icon: (active: boolean) => <House className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden /> },
    { href: "/progress", label: "Progress", icon: (active: boolean) => <ChartNoAxesColumn className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden /> },
    { href: "/settings", label: "Profile", icon: (active: boolean) => <ProfileIcon active={active} /> },
  ];

  return (
    <>
      <nav aria-label="Main" className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <ul className="flex flex-1 rounded-full border border-border bg-card/95 p-1.5 shadow-[0_4px_20px_rgba(30,26,36,0.12)] backdrop-blur-xl">
            {tabs.map(({ href, label, icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-[54px] flex-col items-center justify-center gap-0.5 rounded-full text-[0.68rem] font-medium transition-colors",
                      active ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {icon(active)}
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            aria-label="Log food or activity"
            className="flex size-[62px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(30,26,36,0.25)] transition-transform active:scale-95"
          >
            <Plus className="size-8" strokeWidth={2.4} aria-hidden />
          </button>
        </div>
      </nav>
      <LogSheet open={logOpen} onOpenChange={setLogOpen} />
    </>
  );
}
