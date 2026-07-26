"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandIcon } from "@/components/brand-icon";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingNav({
  isLoggedIn,
  solid,
}: {
  isLoggedIn: boolean;
  solid?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background,border-color,backdrop-filter,box-shadow] duration-300",
        solid || open
          ? "border-b border-[#e2e6ec]/90 bg-white/95 shadow-[0_1px_0_rgba(14,23,38,0.04)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:gap-4 sm:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          onClick={() => setOpen(false)}
        >
          <BrandIcon variant="tile" size={32} />
          <span className="truncate text-sm font-semibold tracking-[-0.02em] text-[#0a1220] sm:text-[0.95rem]">
            Observolife
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[#5a6a7d] transition-colors hover:bg-[#0e1726]/[0.04] hover:text-[#0e1726]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {isLoggedIn ? (
            <Link
              href="/feed"
              className="inline-flex h-9 items-center rounded-full bg-[#0e1726] px-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-10 sm:px-4"
            >
              Log in
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center px-3 text-sm text-[#5a6a7d] transition-colors hover:text-[#0e1726] sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-full bg-[#0e1726] px-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:h-10 sm:px-4"
              >
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Get started</span>
              </Link>
            </>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-[#2a3a4f] transition-colors hover:bg-[#0e1726]/[0.05] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="max-h-[min(28rem,calc(100dvh-3.5rem-env(safe-area-inset-top)))] overflow-y-auto border-t border-[#d8dee8] bg-white px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3.5 text-base text-[#2a3a4f] transition-colors hover:bg-[#f4f6f9] hover:text-[#0e1726]"
              >
                {link.label}
              </a>
            ))}
            {!isLoggedIn ? (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3.5 text-base text-[#2a3a4f] transition-colors hover:bg-[#f4f6f9] sm:hidden"
              >
                Log in
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
