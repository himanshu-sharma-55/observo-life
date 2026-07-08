"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  MOBILE_NAV_INITIAL_PINS,
  MOBILE_NAV_MAX_PINS,
  MOBILE_NAV_PINS_KEY,
  MOBILE_PINNABLE_NAV,
  resolveMobileNavPins,
  type MobileNavItem,
} from "@/lib/mobile-nav/config";

let pinsCache: string[] = [...MOBILE_NAV_INITIAL_PINS];
const listeners = new Set<() => void>();

function readStoredPins(): string[] {
  if (typeof window === "undefined") {
    return [...MOBILE_NAV_INITIAL_PINS];
  }

  try {
    const raw = window.localStorage.getItem(MOBILE_NAV_PINS_KEY);
    if (!raw) return [...MOBILE_NAV_INITIAL_PINS];
    return resolveMobileNavPins(JSON.parse(raw) as string[]);
  } catch {
    return [...MOBILE_NAV_INITIAL_PINS];
  }
}

function writePins(next: string[]) {
  const resolved = resolveMobileNavPins(next);
  pinsCache = resolved;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOBILE_NAV_PINS_KEY, JSON.stringify(resolved));
  }

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return pinsCache;
}

function getServerSnapshot() {
  return MOBILE_NAV_INITIAL_PINS;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === MOBILE_NAV_PINS_KEY) {
      pinsCache = readStoredPins();
      listeners.forEach((listener) => listener());
    }
  });
}

export function useMobileNavPins() {
  const pinnedHrefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const stored = readStoredPins();
    if (stored.join("|") !== pinsCache.join("|")) {
      pinsCache = stored;
      listeners.forEach((listener) => listener());
    }
  }, []);

  const pinnedItems: MobileNavItem[] = pinnedHrefs
    .map((href) => MOBILE_PINNABLE_NAV.find((item) => item.href === href))
    .filter((item): item is MobileNavItem => item !== undefined);

  const pin = useCallback((href: string) => {
    const current = readStoredPins();
    if (current.includes(href) || current.length >= MOBILE_NAV_MAX_PINS) return;
    writePins([...current, href]);
  }, []);

  const unpin = useCallback((href: string) => {
    writePins(readStoredPins().filter((item) => item !== href));
  }, []);

  const togglePin = useCallback((href: string) => {
    const current = readStoredPins();
    if (current.includes(href)) {
      unpin(href);
      return;
    }
    pin(href);
  }, [pin, unpin]);

  const isPinned = useCallback(
    (href: string) => pinnedHrefs.includes(href),
    [pinnedHrefs],
  );

  return {
    pinnedHrefs,
    pinnedItems,
    pin,
    unpin,
    togglePin,
    isPinned,
    canPinMore: pinnedHrefs.length < MOBILE_NAV_MAX_PINS,
    maxPins: MOBILE_NAV_MAX_PINS,
  };
}
