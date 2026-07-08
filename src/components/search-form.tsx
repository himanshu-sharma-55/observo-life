"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Search, SearchX } from "lucide-react";
import { readApiError } from "@/lib/api/client";
import { SIGNAL_MAP } from "@/lib/aggregates/signals";
import { localDayEnd, localDayStart } from "@/lib/dates/day-bounds";
import { Badge } from "@/components/ui/badge";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventText } from "@/components/event-text";
import { eventLogKindLabel } from "@/lib/events/log-kind";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EventItem = {
  id: string;
  rawText: string;
  occurredAt: string;
  logKind?: "moment" | "day";
  tags?: string[];
  amount: string | null;
  currency: string | null;
};

const quickFilters = Object.keys(SIGNAL_MAP);

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [results, setResults] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(searchQuery: string) {
    setLoading(true);
    setError(null);
    setSearched(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (from) params.set("from", localDayStart(from).toISOString());
    if (to) params.set("to", localDayEnd(to).toISOString());
    if (minAmount) params.set("minAmount", minAmount);

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not search your events."));
      }
      const data = await response.json();
      setResults(data.events ?? []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not search your events.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    await runSearch(query);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="surface-card space-y-4 p-4 sm:space-y-5 sm:p-7">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium md:text-sm">
            Search your life
          </Label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="search"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="coffee, gym, stress, biryani..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Quick filters</Label>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((signal) => (
              <Button
                key={signal}
                type="button"
                variant={query === signal ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setQuery(signal);
                  runSearch(signal);
                }}
              >
                {signal}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minAmount">Min spending (₹)</Label>
          <Input
            id="minAmount"
            type="number"
            min={0}
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="500"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full touch-manipulation" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Search events"}
        </Button>
      </form>

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="surface-card h-20 skeleton" />
          ))}
        </div>
      )}

      {!searched && !loading && (
        <EmptyState
          icon={Search}
          title="Search your timeline"
          description="Find past events by keyword, date range, spending, or tap a quick filter above."
        />
      )}

      {searched && !loading && results.length === 0 && !error && (
        <EmptyState
          icon={SearchX}
          title="No matching events"
          description="Try a different keyword, widen your date range, or clear filters and search again."
        />
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {results.length} event{results.length === 1 ? "" : "s"} found
          </p>
          {results.map((event, index) => (
            <article
              key={event.id}
              className="surface-card-interactive animate-in-up p-5"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <EventText className="text-[0.9375rem] leading-relaxed">{event.rawText}</EventText>
              <EventTagsBadges tags={event.tags} className="mt-3" />
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                {event.logKind === "day" && (
                  <Badge variant="outline" className="font-normal text-primary">
                    {eventLogKindLabel(event.logKind)}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(event.occurredAt), "MMM d, yyyy · h:mm a")}
                </span>
                {event.amount && (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {event.currency === "USD" ? "$" : "₹"}
                    {Number(event.amount).toLocaleString()}
                  </Badge>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
