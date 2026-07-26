"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarHeart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { readApiError } from "@/lib/api/client";

type RecapSection = {
  id: string;
  kind: string;
  title: string;
  body: string;
  stat?: { label: string; value: string };
};

type RecapData = {
  month: string;
  headline: string;
  stats: {
    totalEvents: number;
    activeDays: number;
    daysInMonth: number;
    busiestDay: { day: string; count: number } | null;
    topSignals: { label: string; count: number }[];
    spending: { total: number; count: number };
    weeklyRhythm: { week: number; count: number }[];
    isFirstMonth: boolean;
    vsLastMonth: { events: number | null };
  };
  sections: RecapSection[];
  surpriseInsights: { content: string; type: string; title?: string; body?: string }[];
};

function buildCards(recap: RecapData) {
  const cards: { title: string; body: string; stat?: string }[] = [
    {
      title: recap.headline,
      body: `Your ${format(new Date(`${recap.month}-01`), "MMMM yyyy")} at a glance.`,
    },
    {
      title: `${recap.stats.totalEvents} events`,
      body: `You logged on ${recap.stats.activeDays} of ${recap.stats.daysInMonth} days.`,
      stat:
        recap.stats.vsLastMonth.events != null && !recap.stats.isFirstMonth
          ? `${recap.stats.vsLastMonth.events > 0 ? "+" : ""}${recap.stats.vsLastMonth.events}% vs last month`
          : recap.stats.isFirstMonth
            ? "Your first month tracked"
            : undefined,
    },
  ];

  const maxRhythm = Math.max(...recap.stats.weeklyRhythm.map((w) => w.count), 1);
  const rhythmText = recap.stats.weeklyRhythm
    .map((w) => `W${w.week}: ${"█".repeat(Math.max(1, Math.round((w.count / maxRhythm) * 8)))} (${w.count})`)
    .join("\n");

  cards.push({
    title: "Weekly rhythm",
    body: rhythmText || "A steady month of logging.",
  });

  if (recap.stats.topSignals.length > 0) {
    cards.push({
      title: "Top themes",
      body: recap.stats.topSignals
        .slice(0, 3)
        .map((s) => `${s.label}: ${s.count}×`)
        .join(" · "),
    });
  }

  for (const surprise of recap.surpriseInsights) {
    const title =
      "title" in surprise && typeof surprise.title === "string" && surprise.title
        ? surprise.title
        : "You might not have noticed";
    const body =
      "body" in surprise && typeof surprise.body === "string" && surprise.body
        ? surprise.body
        : surprise.content;
    cards.push({ title, body });
  }

  for (const section of recap.sections.slice(0, 3)) {
    cards.push({
      title: section.title,
      body: section.body,
      stat: section.stat ? `${section.stat.label}: ${section.stat.value}` : undefined,
    });
  }

  if (recap.stats.spending.count > 0) {
    cards.push({
      title: "Spending logged",
      body: `${recap.stats.spending.count} purchases · ${recap.stats.spending.total.toLocaleString()} total`,
    });
  }

  cards.push({
    title: "Keep observing",
    body: "Your logs compound. Each month reveals more of the picture.",
  });

  return cards;
}

export function MonthRecapStory({ month }: { month: string }) {
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/recap/${month}`);
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load this recap."));
      }
      const data = await response.json();
      setRecap({
        month: data.recap.month,
        headline: data.recap.headline,
        stats: data.recap.stats,
        sections: data.recap.sections ?? [],
        surpriseInsights: data.recap.surpriseInsights ?? [],
      });

      try {
        await fetch(`/api/recap/${month}`, { method: "PATCH" });
      } catch {
        // Marking viewed is best-effort.
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load this recap.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => i + 1);
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <Sparkles className="size-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-12">
        <EmptyState
          className="w-full max-w-md bg-card"
          icon={CalendarHeart}
          title="Recap unavailable"
          description={error ?? "This month recap could not be loaded or does not exist yet."}
          action={{ label: "Back to feed", href: "/feed" }}
        />
      </div>
    );
  }

  const cards = buildCards(recap);
  const current = Math.min(index, cards.length - 1);
  const card = cards[current];

  return (
    <div className="relative flex min-h-dvh flex-col bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_50%),var(--canvas)]">
      <div className="flex items-center justify-between px-4 py-4">
        <Link
          href="/feed"
          aria-label="Close"
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </Link>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-primary" : "w-2 bg-border",
              )}
            />
          ))}
        </div>
        <div className="w-8" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div
          key={current}
          className="animate-in-up w-full max-w-md space-y-4 text-center"
        >
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            {format(new Date(`${recap.month}-01`), "MMMM yyyy")}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance text-foreground">
            {card.title}
          </h1>
          {card.stat && (
            <p className="text-sm font-medium text-primary">{card.stat}</p>
          )}
          <p className="text-base leading-relaxed whitespace-pre-line text-muted-foreground">
            {card.body}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-8">
        <Button
          variant="outline"
          size="icon"
          disabled={current === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous"
        >
          <ArrowLeft className="size-4" />
        </Button>
        {current < cards.length - 1 ? (
          <Button onClick={() => setIndex((i) => i + 1)} className="gap-1.5">
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Link
            href="/feed"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Back to feed
          </Link>
        )}
      </div>
    </div>
  );
}
