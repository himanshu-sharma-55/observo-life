"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import {
  activityLogText,
  appendActivityLines,
  removeActivityLine,
} from "@/lib/activities/format";
import { EventTagsField } from "@/components/event-tags-field";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventText } from "@/components/event-text";
import { ConfirmPopover } from "@/components/confirm-popover";
import { InlineActivityChips, useSavedActivities } from "@/components/inline-activities";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { localDayEnd, localDayStart } from "@/lib/dates/day-bounds";
import { eventLogKindLabel } from "@/lib/events/log-kind";
import { normalizeTags } from "@/lib/events/tags";
import { mobileCompactFieldClass } from "@/lib/ui/mobile-field";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  rawText: string;
  occurredAt: string;
  logKind: "moment" | "day";
  tags: string[];
  amount: string | null;
  currency: string | null;
};

type SortOrder = "desc" | "asc";
type DateFilterMode = "day" | "range";

export function EventTimeline() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const hasFilters =
    Boolean(tagFilter.trim()) ||
    (filterMode === "day" ? Boolean(day) : Boolean(from || to));

  const loadEvents = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "100", sort });

      if (filterMode === "day" && day) {
        params.set("from", localDayStart(day).toISOString());
        params.set("to", localDayEnd(day).toISOString());
      } else if (filterMode === "range") {
        if (from) params.set("from", localDayStart(from).toISOString());
        if (to) params.set("to", localDayEnd(to).toISOString());
      }

      const trimmedTag = tagFilter.trim();
      if (trimmedTag) params.set("tag", trimmedTag);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not load events."));
        setEvents([]);
        return;
      }

      const data = await response.json();
      setEvents(data.events ?? []);
    } catch {
      toast.error("Could not reach the server.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [day, filterMode, from, sort, tagFilter, to]);

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

  function startEdit(event: EventItem) {
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
            <SelectItem value="desc">Newest</SelectItem>
            <SelectItem value="asc">Oldest</SelectItem>
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
            {events.length} event{events.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface-card space-y-3 p-5">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
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
        <div className="space-y-3">
          {events.map((event, index) => {
            const isEditing = editingId === event.id;
            const isSaving = savingId === event.id;
            return (
              <article
                key={event.id}
                className="surface-card-interactive animate-in-up group flex items-start justify-between gap-4 p-5"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              >
                {isEditing ? (
                  <div className="min-w-0 flex-1 space-y-3">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          void saveEdit(event.id);
                        }
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <InlineActivityChips
                      activities={activities}
                      selectedIds={selectedActivityIds}
                      onToggle={toggleActivity}
                    />
                    <EventTagsField value={tagsDraft} onChange={setTagsDraft} />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveEdit(event.id)}
                        disabled={isSaving || !draft.trim()}
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                        <X className="size-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0 space-y-2.5">
                    <EventText className="text-[0.9375rem] leading-relaxed text-foreground">
                      {event.rawText}
                    </EventText>
                    <EventTagsBadges
                      tags={event.tags}
                      onTagClick={setTagFilter}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {event.logKind === "day" && (
                        <Badge variant="outline" className="font-normal text-primary">
                          {eventLogKindLabel(event.logKind)}
                        </Badge>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {event.logKind === "day"
                          ? format(new Date(event.occurredAt), "MMM d, yyyy")
                          : format(new Date(event.occurredAt), "MMM d, yyyy · h:mm a")}
                      </span>
                      {event.amount && (
                        <Badge variant="outline" className="font-normal text-muted-foreground">
                          {event.currency === "USD" ? "$" : "₹"}
                          {Number(event.amount).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit event"
                      className="touch-manipulation hover:bg-muted hover:text-foreground"
                      onClick={() => startEdit(event)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <ConfirmPopover
                      title="Delete this event?"
                      description="It will be removed from your log."
                      onConfirm={() => deleteEvent(event.id)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete event"
                          className="touch-manipulation hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
