"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/empty-state";
import { FeedInsightCard } from "@/components/feed-insight-card";
import { FeedInsightPreview } from "@/components/feed-insight-preview";
import type { EvidenceEvent } from "@/lib/feed/insight-format";

type FeedItem = {
  id: string;
  type: string;
  content: string;
  title?: string;
  body?: string;
  takeaway?: string;
  source: string;
  evidenceEventIds: string[] | null;
  createdAt: string;
};

type FeedRun = {
  sequence: number;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  overallWindowWeeks?: number;
};

type FeedScope = "current" | "overall";

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex gap-3">
            <div className="skeleton size-10 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RunHeader({ scope, run }: { scope: FeedScope; run: FeedRun }) {
  if (scope === "current") {
    return (
      <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Cycle #{run.sequence} · week of {format(new Date(run.periodStart), "MMM d")}
      </p>
    );
  }
  return (
    <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      Cycle #{run.sequence} · {run.overallWindowWeeks ?? 8}-week view · updated{" "}
      {formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })}
    </p>
  );
}

export function FeedList({
  refreshKey = 0,
  scope = "current",
}: {
  refreshKey?: number;
  scope?: FeedScope;
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [run, setRun] = useState<FeedRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);
  const [evidenceEvents, setEvidenceEvents] = useState<Record<string, EvidenceEvent[]>>({});
  const [evidenceLoading, setEvidenceLoading] = useState<Record<string, boolean>>({});
  const [evidenceErrors, setEvidenceErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/feed?scope=${scope}`);
        if (!response.ok) {
          throw new Error(await readApiError(response, "Could not load your feed."));
        }
        const data = await response.json();
        if (!cancelled) {
          setItems(data.items ?? []);
          setRun(data.run ?? null);
          setExpandedEvidence(null);
          setEvidenceEvents({});
          setEvidenceLoading({});
          setEvidenceErrors({});
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : "Could not load your feed.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, scope]);

  async function dismissItem(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));

    try {
      const response = await fetch(`/api/feed/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setItems(previous);
        toast.error(await readApiError(response, "Could not dismiss that observation."));
      }
    } catch {
      setItems(previous);
      toast.error("Could not reach the server.");
    }
  }

  async function toggleEvidence(itemId: string, eventIds: string[]) {
    if (expandedEvidence === itemId) {
      setExpandedEvidence(null);
      return;
    }

    setExpandedEvidence(itemId);

    if (evidenceEvents[itemId]?.length) return;

    setEvidenceLoading((prev) => ({ ...prev, [itemId]: true }));
    setEvidenceErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    try {
      const res = await fetch(
        `/api/events/evidence?ids=${encodeURIComponent(eventIds.slice(0, 5).join(","))}`,
      );
      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not load related events."));
      }

      const data = await res.json();
      setEvidenceEvents((prev) => ({
        ...prev,
        [itemId]: (data.events ?? []).map((event: EvidenceEvent) => ({
          id: event.id,
          rawText: event.rawText,
          occurredAt: event.occurredAt,
          tags: event.tags,
        })),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load related events.";
      setEvidenceErrors((prev) => ({ ...prev, [itemId]: message }));
      toast.error(message);
    } finally {
      setEvidenceLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  if (loading) return <FeedSkeleton />;

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-8">
        <EmptyState
          icon={Sparkles}
          title={`No ${scope} insights yet`}
          description={
            <>
              Log a few events, then tap{" "}
              <span className="font-medium text-foreground">AI insights</span> to generate your{" "}
              {scope === "current" ? "weekly" : "overall"} feed.
            </>
          }
        />
        <FeedInsightPreview scope={scope} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {run && <RunHeader scope={scope} run={run} />}
      {items.map((item, index) => {
        const evidenceCount = item.evidenceEventIds?.length ?? 0;
        const isExpanded = expandedEvidence === item.id;

        return (
          <FeedInsightCard
            key={item.id}
            type={item.type}
            title={item.title}
            body={item.body}
            takeaway={item.takeaway}
            content={item.content}
            source={item.source}
            createdAt={item.createdAt}
            evidenceCount={evidenceCount}
            evidenceExpanded={isExpanded}
            evidenceEvents={evidenceEvents[item.id] ?? []}
            evidenceLoading={evidenceLoading[item.id]}
            evidenceError={evidenceErrors[item.id]}
            onEvidenceToggle={() => toggleEvidence(item.id, item.evidenceEventIds ?? [])}
            className="animate-in-up"
            cardStyle={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
            onDismiss={() => dismissItem(item.id)}
          />
        );
      })}
    </div>
  );
}
