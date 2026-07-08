"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandIcon } from "@/components/brand-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileMenu } from "@/components/profile-menu";
import {
  isMoreNavActive,
  MobileMoreSheet,
} from "@/components/mobile-more-sheet";
import { useMobileNavPins } from "@/lib/hooks/use-mobile-nav-pins";
import {
  MOBILE_HOME_NAV,
  MOBILE_PINNABLE_NAV,
} from "@/lib/mobile-nav/config";

const sidebarNavItems = [
  { href: "/", label: "Feed", icon: Home },
  ...MOBILE_PINNABLE_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
  })),
];

const mobileNavGridCols: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

function getMobilePageTitle(pathname: string): string | null {
  const titles: Record<string, string> = {
    "/events": "Events",
    "/activities": "Activities",
    "/wants": "Wants",
    "/hypotheses": "Beliefs",
    "/search": "Search",
    "/recap": "Recaps",
    "/settings": "Settings",
  };

  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/recap/")) return "Recap";
  return null;
}

function MobileHeaderBrand({ pathname }: { pathname: string }) {
  const pageTitle = getMobilePageTitle(pathname);
  const isFeed = pathname === "/";

  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
      <BrandIcon variant="tile" size={26} />
      <p className="truncate text-[0.9375rem] font-medium tracking-[-0.01em] text-foreground">
        {isFeed ? "Observolife" : pageTitle}
      </p>
    </Link>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group/nav relative mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[0.875rem] font-medium transition-colors duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-[1.125rem] shrink-0 transition-transform duration-150 group-hover/nav:scale-105",
          active ? "text-primary" : "text-muted-foreground/80",
        )}
      />
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-center rounded-xl py-2 transition-all duration-150 active:scale-90",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon
        className="size-[1.35rem]"
        strokeWidth={active ? 2.25 : 1.75}
      />
    </Link>
  );
}

function MobileMoreButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="More"
      aria-expanded={active}
      className={cn(
        "flex items-center justify-center rounded-xl py-2 transition-all duration-150 active:scale-90",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <LayoutGrid className="size-[1.35rem]" strokeWidth={active ? 2.25 : 1.75} />
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { pinnedItems, pinnedHrefs, togglePin, canPinMore, maxPins } = useMobileNavPins();
  const moreActive = isMoreNavActive(pathname, pinnedHrefs);
  const bottomNavCount = 1 + pinnedItems.length + 1;
  const bottomNavGridClass = mobileNavGridCols[bottomNavCount] ?? "grid-cols-6";
  const bottomNavMaxWidth =
    bottomNavCount >= 6 ? "max-w-[22rem]" : bottomNavCount >= 5 ? "max-w-[19.5rem]" : "max-w-[17.5rem]";

  return (
    <div className="flex h-svh w-full overflow-hidden bg-canvas">
      <aside className="hidden w-[16.5rem] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 px-5">
          <BrandIcon variant="tile" size={34} />
          <div className="leading-tight">
            <p className="text-[0.9375rem] font-semibold tracking-tight">Observolife</p>
            <p className="text-xs text-muted-foreground">Personal observation engine</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3">
          {sidebarNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <ProfileMenu variant="full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md md:hidden">
          <MobileHeaderBrand pathname={pathname} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu variant="compact" />
          </div>
        </header>

        <main className="mobile-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:pb-8">
            {children}
          </div>
        </main>

        <nav className="shrink-0 md:hidden">
          <div className="flex justify-center px-5 pt-1 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
            <div
              className={cn(
                "mobile-floating-nav grid w-full",
                bottomNavMaxWidth,
                bottomNavGridClass,
              )}
            >
              <MobileNavLink
                key={MOBILE_HOME_NAV.href}
                {...MOBILE_HOME_NAV}
                active={pathname === MOBILE_HOME_NAV.href}
              />
              {pinnedItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  {...item}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                />
              ))}
              <MobileMoreButton active={moreActive} onClick={() => setMoreOpen(true)} />
            </div>
          </div>
        </nav>
      </div>

      <MobileMoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        pinnedHrefs={pinnedHrefs}
        onTogglePin={togglePin}
        canPinMore={canPinMore}
        maxPins={maxPins}
      />
    </div>
  );
}
