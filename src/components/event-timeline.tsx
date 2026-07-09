"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import {
  activityLogText,
  appendActivityLines,
  removeActivityLine,
} from "@/lib/activities/format";
import { EventDayTimeline } from "@/components/event-day-timeline";
import { useSavedActivities } from "@/components/inline-activities";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { localDayEnd, localDayStart } from "@/lib/dates/day-bounds";
import { groupEventsByDay, type TimelineEvent } from "@/lib/events/group-by-day";
import { normalizeTags } from "@/lib/events/tags";
import { EVENTS_PAGE_SIZE } from "@/lib/pagination";
import { mobileCompactFieldClass } from "@/lib/ui/mobile-field";
import { cn } from "@/lib/utils";
import { EventTimelineSkeleton } from "@/components/lazy-loading-skeletons";

type SortOrder = "desc" | "asc";
type DateFilterMode = "day" | "range";

export function EventTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filterMode, setFilterMode] = useState<DateFilterMode>("day");
  const [day, setDay] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortOrder>("desc");
  const [tagFilter, setTagFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState<string[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activityLines, setActivityLines] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const activities = useSavedActivities(editingId !== null);

  const dayGroups = useMemo(() => groupEventsByDay(events, sort), [events, sort]);

  const hasFilters =
    Boolean(tagFilter.trim()) ||
    (filterMode === "day" ? Boolean(day) : Boolean(from || to));

  const buildParams = useCallback(
    (skip: number) => {
      const params = new URLSearchParams({
        limit: String(EVENTS_PAGE_SIZE),
        sort,
        skip: String(skip),
      });

      if (filterMode === "day" && day) {
        params.set("from", localDayStart(day).toISOString());
        params.set("to", localDayEnd(day).toISOString());
      } else if (filterMode === "range") {
        if (from) params.set("from", localDayStart(from).toISOString());
        if (to) params.set("to", localDayEnd(to).toISOString());
      }

      const trimmedTag = tagFilter.trim();
      if (trimmedTag) params.set("tag", trimmedTag);

      return params;
    },
    [day, filterMode, from, sort, tagFilter, to],
  );

  const loadEvents = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/events?${buildParams(0).toString()}`);
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not load events."));
        setEvents([]);
        setHasMore(false);
        return;
      }

      const data = await response.json();
      setEvents(data.events ?? []);
      setHasMore(Boolean(data.hasMore));
    } catch {
      toast.error("Could not reach the server.");
      setEvents([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  async function loadMoreEvents() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await fetch(`/api/events?${buildParams(events.length).toString()}`);
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not load more events."));
        return;
      }

      const data = await response.json();
      const nextEvents = data.events ?? [];
      setEvents((current) => [...current, ...nextEvents]);
      setHasMore(Boolean(data.hasMore));
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  function clearFilters() {
    setDay("");
    setFrom("");
    setTo("");
    setTagFilter("");
  }

  function switchFilterMode(mode: DateFilterMode) {
    if (mode === filterMode) return;
    if (mode === "range" && day) {
      setFrom(day);
      setTo("");
      setDay("");
    } else if (mode === "day" && from && (!to || from === to)) {
      setDay(from);
      setFrom("");
      setTo("");
    } else {
      clearFilters();
    }
    setFilterMode(mode);
  }

  async function deleteEvent(id: string) {
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not delete event."));
        return;
      }

      setEvents((current) => current.filter((event) => event.id !== id));
      toast.success("Event deleted.");
    } catch {
      toast.error("Could not reach the server.");
    }
  }

  function startEdit(event: TimelineEvent) {
    setEditingId(event.id);
    setDraft(event.rawText);
    setTagsDraft(event.tags ?? []);
    setSelectedActivityIds([]);
    setActivityLines({});
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
    setTagsDraft([]);
    setSelectedActivityIds([]);
    setActivityLines({});
  }

  function addActivity(activity: SerializedSavedActivity) {
    const line = activityLogText(activity);
    setActivityLines((current) => ({ ...current, [activity.id]: line }));
    setSelectedActivityIds((current) =>
      current.includes(activity.id) ? current : [...current, activity.id],
    );
    setDraft((current) => appendActivityLines(current, [line]));
    setTagsDraft((current) => normalizeTags([...current, ...activity.tags]));
  }

  function removeActivity(activityId: string) {
    const line = activityLines[activityId];
    if (line) {
      setDraft((current) => removeActivityLine(current, line));
      setActivityLines((current) => {
        const next = { ...current };
        delete next[activityId];
        return next;
      });
    }
    setSelectedActivityIds((current) => current.filter((id) => id !== activityId));
  }

  function toggleActivity(activity: SerializedSavedActivity) {
    if (selectedActivityIds.includes(activity.id)) {
      removeActivity(activity.id);
    } else {
      addActivity(activity);
    }
  }

  async function saveEdit(id: string) {
    if (!draft.trim()) return;

    setSavingId(id);
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: draft,
          tags: tagsDraft,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not update event."));
      }
      const data = await response.json();
      setEvents((current) =>
        current.map((event) => (event.id === id ? { ...event, ...data.event } : event)),
      );
      toast.success("Event updated.");
      cancelEdit();
    } catch {
      toast.error("Could not update event.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex shrink-0 rounded-md border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => switchFilterMode("day")}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
              filterMode === "day"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => switchFilterMode("range")}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
              filterMode === "range"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            Range
          </button>
        </div>

        {filterMode === "day" ? (
          <Input
            id="events-day"
            type="date"
            aria-label="Filter by date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={cn("w-full min-w-[10.5rem] shrink-0 px-2 shadow-none sm:w-[10.5rem]", mobileCompactFieldClass)}
          />
        ) : (
          <>
            <Input
              id="events-from"
              type="date"
              aria-label="From date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={cn("w-full min-w-[9.75rem] shrink-0 px-2 shadow-none sm:w-[9.75rem]", mobileCompactFieldClass)}
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              id="events-to"
              type="date"
              aria-label="To date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className={cn("w-full min-w-[9.75rem] shrink-0 px-2 shadow-none sm:w-[9.75rem]", mobileCompactFieldClass)}
            />
          </>
        )}

        <Select value={sort} onValueChange={(value) => setSort((value as SortOrder) ?? "desc")}>
          <SelectTrigger
            id="events-sort"
            aria-label="Sort by date"
            className={cn("w-[7.25rem] shrink-0 px-2 shadow-none", mobileCompactFieldClass)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest days</SelectItem>
            <SelectItem value="asc">Oldest days</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Filter by tag"
          placeholder="Tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className={cn("w-full min-w-[7rem] shrink-0 px-2 shadow-none sm:w-[7rem]", mobileCompactFieldClass)}
        />

        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-8 text-muted-foreground"
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}

        {!loading && (
          <span className="ml-auto text-xs text-muted-foreground">
            {dayGroups.length} day{dayGroups.length === 1 ? "" : "s"} · {events.length} log
            {events.length === 1 ? "" : "s"}
            {hasMore ? "+" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <EventTimelineSkeleton />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={hasFilters ? (filterMode === "day" ? "No events on this day" : "No events in this range") : "No events yet"}
          description={
            hasFilters
              ? filterMode === "day"
                ? "Try another date or clear the filter to see all events."
                : "Try widening your date range or clear the filters to see all events."
              : "Log what happened from the Feed. Everything starts with one line."
          }
          action={
            hasFilters
              ? { label: "Clear", onClick: clearFilters }
              : { label: "Go to feed", href: "/" }
          }
        />
      ) : (
        <div className="space-y-4">
          <EventDayTimeline
            groups={dayGroups}
            editingId={editingId}
            draft={draft}
            tagsDraft={tagsDraft}
            selectedActivityIds={selectedActivityIds}
            savingId={savingId}
            activities={activities}
            onDraftChange={setDraft}
            onTagsDraftChange={setTagsDraft}
            onToggleActivity={toggleActivity}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onDelete={deleteEvent}
            onTagClick={setTagFilter}
          />
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full touch-manipulation sm:h-9 sm:w-auto"
                onClick={() => void loadMoreEvents()}
                disabled={loadingMore}
                data-loading={loadingMore ? "" : undefined}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more events"
                )}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
