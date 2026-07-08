"use client";

import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import type { EvidenceEvent } from "@/lib/feed/insight-format";
import { FeedInsightEvidence } from "@/components/feed-insight-evidence";
import { ConfirmPopover } from "@/components/confirm-popover";
import { Button } from "@/components/ui/button";
import { splitInsightBody } from "@/lib/feed/insight-format";
import { getFeedInsightTypeStyle } from "@/lib/feed/type-styles";
import { cn } from "@/lib/utils";

export type FeedInsightCardProps = {
  type: string;
  title?: string;
  body?: string;
  takeaway?: string;
  content?: string;
  source?: "ai" | "system" | string;
  createdAt?: string;
  evidenceCount?: number;
  isExample?: boolean;
  className?: string;
  cardStyle?: React.CSSProperties;
  evidenceExpanded?: boolean;
  evidenceEvents?: EvidenceEvent[];
  evidenceLoading?: boolean;
  evidenceError?: string | null;
  onEvidenceToggle?: () => void;
  onDismiss?: () => void;
};

export function FeedInsightCard({
  type,
  title,
  body,
  takeaway,
  content,
  source = "ai",
  createdAt,
  evidenceCount = 0,
  isExample = false,
  className,
  cardStyle,
  evidenceExpanded = false,
  evidenceEvents = [],
  evidenceLoading = false,
  evidenceError = null,
  onEvidenceToggle,
  onDismiss,
}: FeedInsightCardProps) {
  const typeStyle = getFeedInsightTypeStyle(type);
  const Icon = typeStyle.icon;
  const displayBody = body ?? content ?? "";
  const paragraphs = splitInsightBody(displayBody);
  const displayTitle = title?.trim();
  const showEvidence = evidenceCount > 0 && (onEvidenceToggle || isExample);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--shadow-soft)] transition-[box-shadow,transform,border-color] duration-300",
        !isExample && "hover:-translate-y-0.5 hover:border-border hover:shadow-[var(--shadow-soft-lg)]",
        isExample && "border-dashed border-border/90 bg-muted/10 shadow-none",
        className,
      )}
      style={cardStyle}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
          typeStyle.wash,
        )}
        aria-hidden
      />

      <div className="relative p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                typeStyle.iconBg,
                typeStyle.iconColor,
                typeStyle.ring,
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase",
                    typeStyle.tag,
                  )}
                >
                  {typeStyle.label}
                </span>
                {source === "ai" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-foreground/70 uppercase">
                    <Sparkles className="size-3" />
                    AI
                  </span>
                )}
                {isExample && (
                  <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                    Example
                  </span>
                )}
              </div>
              {createdAt && !isExample ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
              ) : null}
            </div>
          </div>

          {onDismiss && !isExample ? (
            <ConfirmPopover
              title="Dismiss this insight?"
              description="You can generate new ones anytime."
              confirmLabel="Dismiss"
              onConfirm={onDismiss}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Dismiss"
                  className="shrink-0 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                >
                  <X className="size-3.5" />
                </Button>
              }
            />
          ) : null}
        </div>

        <div className="space-y-3.5">
          {displayTitle ? (
            <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
              {displayTitle}
            </h3>
          ) : null}

          <div className="space-y-3">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-[0.9375rem] leading-[1.65] text-foreground/90 sm:text-base sm:leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {takeaway?.trim() ? (
            <div
              className={cn(
                "rounded-xl border-l-[3px] px-4 py-3",
                typeStyle.takeawayAccent,
              )}
            >
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                <ArrowUpRight className="mt-0.5 size-4 shrink-0 opacity-80" />
                <span>{takeaway.trim()}</span>
              </p>
            </div>
          ) : null}
        </div>

        {showEvidence ? (
          <div className="mt-4 border-t border-border/50 pt-4">
            <FeedInsightEvidence
              count={evidenceCount}
              expanded={evidenceExpanded}
              onToggle={onEvidenceToggle ?? (() => undefined)}
              events={evidenceEvents}
              loading={evidenceLoading}
              error={evidenceError}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
