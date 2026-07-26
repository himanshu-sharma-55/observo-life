"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarHeart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

type RecapListItem = {
  month: string;
  label: string;
  headline: string;
  generatedAt: string;
  viewedAt: string | null;
  totalEvents: number;
};

export default function RecapArchivePage() {
  const [recaps, setRecaps] = useState<RecapListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/recap/list");
        if (!response.ok) {
          throw new Error("Could not load recaps.");
        }

        const data = await response.json();
        if (!cancelled) {
          setRecaps(data.recaps ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRecaps([]);
          setError(
            loadError instanceof Error ? loadError.message : "Could not load recaps.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <AppShell>
      <PageHeader
        title="Month recaps"
        description="Your monthly stories — stats, patterns, and surprises."
      />
      {error ? (
        <div className="surface-card space-y-4 border-destructive/25 bg-destructive/5 p-4 sm:p-7">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => setReloadToken((token) => token + 1)}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-card h-24 skeleton" />
          ))}
        </div>
      ) : recaps.length === 0 ? (
        <EmptyState
          icon={CalendarHeart}
          title="No recaps yet"
          description="Log through a month, then use Get month insights on your feed to generate your first story."
          action={{ label: "Go to feed", href: "/feed" }}
        />
      ) : (
        <ul className="space-y-3">
          {recaps.map((recap) => (
            <li key={recap.month}>
              <Link
                href={`/recap/${recap.month}`}
                className="surface-card-interactive block rounded-xl p-4"
              >
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {recap.label}
                </p>
                <p className="mt-1 font-medium text-foreground">{recap.headline}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recap.totalEvents} events ·{" "}
                  {format(new Date(recap.generatedAt), "MMM d, yyyy")}
                  {!recap.viewedAt && " · New"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
