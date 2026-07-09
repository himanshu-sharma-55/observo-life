import {
  Bookmark,
  CalendarDays,
  CalendarHeart,
  Compass,
  FlaskConical,
  Home,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type MobileNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const MOBILE_HOME_HREF = "/";

export const MOBILE_HOME_NAV: MobileNavItem = {
  href: MOBILE_HOME_HREF,
  label: "Feed",
  description: "Your observation feed",
  icon: Home,
};

/** Apps that can be pinned to the bottom bar (everything except home). */
export const MOBILE_PINNABLE_NAV: MobileNavItem[] = [
  {
    href: "/events",
    label: "Events",
    description: "What happened and when",
    icon: CalendarDays,
  },
  {
    href: "/activities",
    label: "Activities",
    description: "Saved shortcuts for things you log often",
    icon: Bookmark,
  },
  {
    href: "/search",
    label: "Search",
    description: "Find events across your log",
    icon: Search,
  },
  {
    href: "/wants",
    label: "Wants",
    description: "Directions you're moving toward",
    icon: Compass,
  },
  {
    href: "/hypotheses",
    label: "Beliefs",
    description: "Assumptions to check against your life",
    icon: FlaskConical,
  },
  {
    href: "/recap",
    label: "Recaps",
    description: "Monthly stories and patterns",
    icon: CalendarHeart,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Preferences and your data",
    icon: Settings,
  },
];

export const MOBILE_NAV_PINS_KEY = "observolife-mobile-nav-pins";
export const MOBILE_NAV_MAX_PINS = 4;

export const MOBILE_NAV_DEFAULT_PINS = ["/events", "/search"];

export function isMobileNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isMoreNavActive(pathname: string, pinnedHrefs: readonly string[]) {
  return MOBILE_PINNABLE_NAV.filter((item) => !pinnedHrefs.includes(item.href)).some((item) =>
    isMobileNavItemActive(pathname, item.href),
  );
}

export function resolveMobileNavPins(stored: string[] | null | undefined): string[] {
  const allowed = new Set(MOBILE_PINNABLE_NAV.map((item) => item.href));
  const pins = (stored ?? MOBILE_NAV_DEFAULT_PINS).filter((href) => allowed.has(href));
  return pins.slice(0, MOBILE_NAV_MAX_PINS);
}

/** Stable default pins for SSR / hydration (must be a cached reference). */
export const MOBILE_NAV_INITIAL_PINS: readonly string[] = Object.freeze(
  resolveMobileNavPins(MOBILE_NAV_DEFAULT_PINS),
);

export function getMobileNavItem(href: string): MobileNavItem | undefined {
  if (href === MOBILE_HOME_HREF) return MOBILE_HOME_NAV;
  return MOBILE_PINNABLE_NAV.find((item) => item.href === href);
}
