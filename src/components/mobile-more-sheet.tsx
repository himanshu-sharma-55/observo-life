"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  isMobileNavItemActive,
  MOBILE_PINNABLE_NAV,
  type MobileNavItem,
} from "@/lib/mobile-nav/config";

export type MoreNavItem = MobileNavItem;

export function MobileMoreSheet({
  open,
  onOpenChange,
  pinnedHrefs,
  onTogglePin,
  canPinMore,
  maxPins,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pinnedHrefs: readonly string[];
  onTogglePin: (href: string) => void;
  canPinMore: boolean;
  maxPins: number;
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="px-1 text-left">
          <SheetTitle>More</SheetTitle>
          <SheetDescription>
            Pin up to {maxPins} apps to the bottom bar. Feed always stays there.
          </SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1.5">
          {MOBILE_PINNABLE_NAV.map((item) => {
            const Icon = item.icon;
            const active = isMobileNavItemActive(pathname, item.href);
            const pinned = pinnedHrefs.includes(item.href);
            const pinDisabled = !pinned && !canPinMore;

            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl pr-1.5 transition-colors",
                  active ? "bg-primary/10" : "hover:bg-muted/70",
                )}
              >
                <Link
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 active:scale-[0.99]",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary/15" : "bg-muted",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => onTogglePin(item.href)}
                  disabled={pinDisabled}
                  aria-label={
                    pinned
                      ? `Unpin ${item.label} from bottom bar`
                      : pinDisabled
                        ? `Bottom bar is full (${maxPins} apps)`
                        : `Pin ${item.label} to bottom bar`
                  }
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors active:scale-95",
                    pinned
                      ? "bg-primary/15 text-primary"
                      : pinDisabled
                        ? "text-muted-foreground/40"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {pinned ? <Pin className="size-4 fill-current" /> : <Pin className="size-4" />}
                </button>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
