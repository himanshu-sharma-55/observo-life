"use client";

import { format } from "date-fns";
import { ChevronDown, Link2, Loader2 } from "lucide-react";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventText } from "@/components/event-text";
import { cn } from "@/lib/utils";

import type { EvidenceEvent } from "@/lib/feed/insight-format";
export type { EvidenceEvent } from "@/lib/feed/insight-format";

type FeedInsightEvidenceProps = {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  events: EvidenceEvent[];
  loading?: boolean;
  error?: string | null;
  className?: string;
};

export function FeedInsightEvidence({
  count,
  expanded,
  onToggle,
  events,
  loading = false,
  error = null,
  className,
}: FeedInsightEvidenceProps) {
  if (count <= 0) return null;

  return (
    <div className={cn("pt-1", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 px-3.5 py-2.5 text-left transition-all duration-200",
          "hover:border-border hover:bg-muted/50 active:scale-[0.995]",
          expanded && "rounded-b-none border-b-0 bg-muted/40",
        )}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="flex size-7 items-center justify-center rounded-lg bg-background shadow-[var(--shadow-xs)] ring-1 ring-border/60">
            <Link2 className="size-3.5 text-muted-foreground" />
          </span>
          {count} source event{count === 1 ? "" : "s"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 rounded-b-xl border border-t-0 border-border/80 bg-muted/20 p-2.5">
            {loading && events.length === 0 && !error ? (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Loading events…
              </div>
            ) : null}

            {error ? (
              <p className="px-2 py-2 text-xs text-destructive">{error}</p>
            ) : null}

            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-border/60 bg-card px-3 py-2.5 shadow-[var(--shadow-xs)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <EventText className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                    {event.rawText}
                  </EventText>
                  <time
                    dateTime={event.occurredAt}
                    className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                  >
                    {format(new Date(event.occurredAt), "MMM d")}
                  </time>
                </div>
                <EventTagsBadges tags={event.tags} className="mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
