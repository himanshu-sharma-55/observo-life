"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandIcon } from "@/components/brand-icon";
import { cn } from "@/lib/utils";

const DEFAULT_MESSAGES = [
  "Reading your recent logs…",
  "Looking for patterns and shifts…",
  "Connecting the dots across your week…",
  "Crafting insights worth your time…",
  "Almost there…",
];

type AiThinkingOverlayProps = {
  open: boolean;
  messages?: string[];
  className?: string;
};

export function AiThinkingOverlay({
  open,
  messages = DEFAULT_MESSAGES,
  className,
}: AiThinkingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setMessageIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [messages.length, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted || !open || typeof document === "undefined") {
    return null;
  }

  const message = messages[messageIndex] ?? messages[0];

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center p-6",
        className,
      )}
    >
      <div className="absolute inset-0 bg-background/78 backdrop-blur-md supports-backdrop-filter:bg-background/65" />

      <div
        className="pointer-events-none absolute -left-[12%] top-[14%] h-[42%] w-[52%] rounded-full opacity-50 blur-3xl motion-safe:animate-[ai-aura-drift_18s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 28%, transparent) 0%, transparent 72%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[10%] bottom-[10%] h-[38%] w-[48%] rounded-full opacity-45 blur-3xl motion-safe:animate-[ai-aura-drift-alt_22s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--timeline-moment) 32%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative w-full max-w-sm animate-in-up">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/92 p-8 shadow-[var(--shadow-soft-lg)] backdrop-blur-sm">
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full opacity-70 blur-2xl"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklch, var(--primary) 18%, transparent), transparent)",
            }}
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-6">
              <span
                className="absolute inset-0 m-auto size-24 rounded-full motion-safe:animate-[ai-persona-ring_2.4s_ease-in-out_infinite]"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in oklch, var(--primary) 22%, transparent) 0%, transparent 70%)",
                }}
                aria-hidden
              />
              <div className="relative motion-safe:animate-[ai-persona-float_3.2s_ease-in-out_infinite]">
                <BrandIcon variant="tile" size={72} />
              </div>
            </div>

            <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-primary uppercase">
              Observolife
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              Observing your life
            </h2>
            <p
              key={message}
              className="mt-3 min-h-[3.25rem] text-sm leading-relaxed text-muted-foreground motion-safe:animate-in-up"
            >
              {message}
            </p>

            <div className="mt-5 flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1.5 rounded-full bg-primary/70 motion-safe:animate-[ai-thinking-dot_1.2s_ease-in-out_infinite]"
                  style={{ animationDelay: `${dot * 180}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
