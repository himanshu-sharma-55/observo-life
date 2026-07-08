"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FeedInsightCard } from "@/components/feed-insight-card";
import { getExampleInsightsForScope } from "@/lib/feed/example-insights";
import { cn } from "@/lib/utils";

type FeedInsightPreviewProps = {
  scope?: "current" | "overall";
  compact?: boolean;
  className?: string;
};

export function FeedInsightPreview({
  scope = "current",
  compact = false,
  className,
}: FeedInsightPreviewProps) {
  const examples = getExampleInsightsForScope(scope).slice(0, compact ? 1 : 2);
  const [expandedId, setExpandedId] = useState<string | null>(
    compact ? `${examples[0]?.type}-0` : null,
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Sparkles className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">What your insights look like</p>
          <p className="text-xs text-muted-foreground">
            {scope === "current"
              ? "Tap source events on real cards to see the logs behind each insight."
              : "Multi-paragraph patterns with expandable evidence."}
          </p>
        </div>
      </div>

      <div className={cn("space-y-4", compact && "space-y-3")}>
        {examples.map((example, index) => {
          const cardId = `${example.type}-${index}`;
          const isExpanded = expandedId === cardId;

          return (
            <FeedInsightCard
              key={cardId}
              type={example.type}
              title={example.title}
              body={example.body}
              takeaway={example.takeaway}
            evidenceCount={example.sampleEvents?.length ?? 0}
            evidenceExpanded={isExpanded}
            evidenceEvents={isExpanded ? (example.sampleEvents ?? []) : []}
              onEvidenceToggle={() =>
                setExpandedId((current) => (current === cardId ? null : cardId))
              }
              isExample
              className={compact ? "shadow-[var(--shadow-xs)]" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
