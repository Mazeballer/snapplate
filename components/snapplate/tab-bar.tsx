"use client";

import { ChartNoAxesColumn, House, Plus, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogSheet } from "@/components/snapplate/log-sheet";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();
  const [logOpen, setLogOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      >
        <div className="mx-auto flex h-16 max-w-md items-center gap-2 px-3 pb-safe box-content">
          <ul className="flex flex-1 items-center">
            {TABS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[0.7rem] font-medium transition-colors",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-6" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
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
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus className="size-7" strokeWidth={2.4} aria-hidden />
          </button>
        </div>
      </nav>
      <LogSheet open={logOpen} onOpenChange={setLogOpen} />
    </>
  );
}
