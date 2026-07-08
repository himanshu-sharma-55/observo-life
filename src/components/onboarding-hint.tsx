"use client";

import { PenLine, Clock, CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const tips = [
  {
    icon: PenLine,
    title: "Just type what happened",
    body: "Write in plain language and press Enter. No forms, no categories.",
  },
  {
    icon: CalendarDays,
    title: "Summarize a whole day",
    body: "Use Day log for one entry about the day. AI reads it with any other events from that date.",
  },
  {
    icon: Clock,
    title: "Backdate anything",
    body: "Use Past time to log something you forgot earlier.",
  },
];

export function OnboardingHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="animate-in-up mb-9 overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="text-[0.9375rem] font-semibold text-foreground">
            Welcome to Observolife
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Log life as it happens. Patterns surface on their own — no judgment, no goals.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          className="-mr-1 -mt-1 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        {tips.map((tip) => (
          <div key={tip.title} className="flex gap-3 sm:flex-col sm:gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <tip.icon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{tip.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
