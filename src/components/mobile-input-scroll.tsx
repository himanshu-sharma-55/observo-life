"use client";

import { useEffect } from "react";

const FOCUSABLE =
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"], [role="combobox"], [data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"]';

const MOBILE_MEDIA = "(max-width: 767px)";

function scrollFieldIntoView(target: HTMLElement) {
  target.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });

  // iOS often needs a second pass after the keyboard animation starts.
  window.setTimeout(() => {
    target.scrollIntoView({ block: "center", inline: "nearest" });
  }, 320);
}

export function MobileInputScroll() {
  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      if (!window.matchMedia(MOBILE_MEDIA).matches) return;

      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.matches(FOCUSABLE)) return;

      window.requestAnimationFrame(() => {
        scrollFieldIntoView(target);
      });
    }

    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  return null;
}
