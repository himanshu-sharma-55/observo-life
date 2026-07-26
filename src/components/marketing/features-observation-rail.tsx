"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    stamp: "09:12",
    title: "Log",
    line: "One sentence. Enter. Done.",
    detail: "Moments, past times, or a whole day. No forms.",
  },
  {
    stamp: "11:40",
    title: "Timeline",
    line: "Days stack the way memory does.",
    detail: "Browse, edit, search. Your private source of truth.",
  },
  {
    stamp: "14:05",
    title: "Search",
    line: "Find any week in seconds.",
    detail: "Coffee runs, quiet Sundays, stressful stretches.",
  },
  {
    stamp: "16:22",
    title: "Insights",
    line: "AI with receipts.",
    detail: "Patterns cite your events. Ask only when curious.",
  },
  {
    stamp: "18:50",
    title: "Context",
    line: "Wants and beliefs, optional.",
    detail: "Give AI direction without turning life into goals.",
  },
  {
    stamp: "21:03",
    title: "Recaps",
    line: "A month, told back to you.",
    detail: "Rhythms and surprises from what you actually logged.",
  },
] as const;

export function FeaturesObservationRail() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-24">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-[#1a7d6f] uppercase">
          Capabilities
        </p>
        <h2 className="mt-3 max-w-sm font-[family-name:var(--font-marketing-display)] text-[2.25rem] leading-[1.1] tracking-[-0.03em] text-[#0a1220] sm:mt-4 sm:text-5xl">
          A day of Observolife.
        </h2>
        <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-[#4f6175] sm:mt-5">
          Not a grid of promises. A day unfolding.{" "}
          <span className="lg:hidden">Tap a moment.</span>
          <span className="hidden lg:inline">Hover a moment.</span>
        </p>

        <div className="mt-10 hidden lg:block">
          <p className="font-[family-name:var(--font-marketing-display)] text-6xl tracking-tight text-[#0a1220]/[0.06]">
            {CAPABILITIES[active]?.stamp}
          </p>
          <p className="mt-2 text-sm text-[#4f6175]">{CAPABILITIES[active]?.detail}</p>
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute top-3 bottom-3 left-[2.35rem] w-px bg-gradient-to-b from-[#1a7d6f]/50 via-[#d5dde8] to-transparent sm:left-[3.35rem]"
          aria-hidden
        />

        <ul className="space-y-1">
          {CAPABILITIES.map((item, index) => {
            const isActive = active === index;

            return (
              <li key={item.title}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  className={cn(
                    "group relative grid w-full grid-cols-[3.75rem_1fr] items-start gap-2 rounded-xl px-1.5 py-3.5 text-left transition-colors sm:grid-cols-[5.5rem_1fr] sm:gap-5 sm:rounded-2xl sm:px-3 sm:py-5",
                    isActive ? "bg-[#eef1f6] lg:bg-[#eef1f6]" : "hover:bg-[#eef1f6]/70",
                  )}
                >
                  <span
                    className={cn(
                      "relative z-[1] pt-1 text-[0.7rem] font-medium tabular-nums tracking-wide transition-colors sm:text-xs",
                      isActive ? "text-[#1a7d6f]" : "text-[#4f6175]/80",
                    )}
                  >
                    {item.stamp}
                    <span
                      className={cn(
                        "absolute top-1.5 -right-2.5 size-2 rounded-full border-2 border-white transition-colors sm:-right-4",
                        isActive ? "bg-[#1a7d6f]" : "bg-[#d5dde8]",
                      )}
                      aria-hidden
                    />
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1">
                      <span
                        className={cn(
                          "font-[family-name:var(--font-marketing-display)] text-xl tracking-[-0.02em] transition-colors sm:text-3xl",
                          isActive ? "text-[#0a1220]" : "text-[#0a1220]/55",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "text-sm transition-opacity sm:text-[0.95rem]",
                          isActive ? "text-[#4f6175] opacity-100" : "text-[#4f6175] opacity-70",
                        )}
                      >
                        {item.line}
                      </span>
                    </span>

                    <motion.span
                      className="mt-2 block overflow-hidden text-sm leading-relaxed text-[#4f6175] lg:hidden"
                      initial={false}
                      animate={
                        reduceMotion
                          ? undefined
                          : {
                              height: isActive ? "auto" : 0,
                              opacity: isActive ? 1 : 0,
                            }
                      }
                      transition={{ duration: 0.25 }}
                    >
                      {item.detail}
                    </motion.span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
