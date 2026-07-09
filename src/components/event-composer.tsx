"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import {
  activityLogText,
  appendActivityLines,
  removeActivityLine,
} from "@/lib/activities/format";
import { EventTagsField } from "@/components/event-tags-field";
import { InlineActivityChips, useSavedActivities } from "@/components/inline-activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeTags, rememberEventTags } from "@/lib/events/tags";
import {
  enqueueOfflineEvent,
  flushOfflineQueue,
  isOnline,
} from "@/lib/offline/queue";
import { isPortaledOverlay } from "@/lib/dom/portaled-overlay";
import { isCoarsePointerDevice } from "@/lib/ui/coarse-pointer";
import { cn } from "@/lib/utils";

type LogMode = "moment" | "past" | "day";

async function postEvent(payload: Record<string, unknown>) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to log event");
  }

  return data as { updated?: boolean };
}

function todayDateInputValue() {
  return format(new Date(), "yyyy-MM-dd");
}

function resetComposerState(setters: {
  setText: (value: string) => void;
  setTags: (value: string[]) => void;
  setSelectedActivityIds: (value: string[]) => void;
  setActivityLines: (value: Record<string, string>) => void;
  setExpanded: (value: boolean) => void;
  setLogMode: (value: LogMode) => void;
  setOccurredAt: (value: string) => void;
  setLogDay: (value: string) => void;
}) {
  setters.setText("");
  setters.setTags([]);
  setters.setSelectedActivityIds([]);
  setters.setActivityLines({});
  setters.setExpanded(false);
  setters.setLogMode("moment");
  setters.setOccurredAt("");
  setters.setLogDay(todayDateInputValue());
}

export function EventComposer({ onLogged }: { onLogged?: () => void }) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [logMode, setLogMode] = useState<LogMode>("moment");
  const [occurredAt, setOccurredAt] = useState("");
  const [logDay, setLogDay] = useState(todayDateInputValue);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activityLines, setActivityLines] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activities = useSavedActivities(expanded);

  const reset = useCallback(() => {
    resetComposerState({
      setText,
      setTags,
      setSelectedActivityIds,
      setActivityLines,
      setExpanded,
      setLogMode,
      setOccurredAt,
      setLogDay,
    });
  }, []);

  function addActivity(activity: SerializedSavedActivity) {
    const line = activityLogText(activity);
    setActivityLines((current) => ({ ...current, [activity.id]: line }));
    setSelectedActivityIds((current) =>
      current.includes(activity.id) ? current : [...current, activity.id],
    );
    setText((current) => appendActivityLines(current, [line]));
    setTags((current) => normalizeTags([...current, ...activity.tags]));
  }

  function removeActivity(activityId: string) {
    const line = activityLines[activityId];
    if (line) {
      setText((current) => removeActivityLine(current, line));
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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current?.contains(target)) return;
      if (isPortaledOverlay(target)) return;

      if (
        expanded &&
        !text.trim() &&
        logMode === "moment" &&
        tags.length === 0 &&
        selectedActivityIds.length === 0
      ) {
        setExpanded(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded, logMode, selectedActivityIds.length, tags.length, text]);

  function switchLogMode(mode: LogMode) {
    setLogMode(mode);
    if (mode === "day" && !logDay) {
      setLogDay(todayDateInputValue());
    }
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();

    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (logMode === "past" && !occurredAt) {
      toast.error("Pick when it happened, or switch back to a normal log.");
      return;
    }

    if (logMode === "day" && !logDay) {
      toast.error("Pick which day this summary is for.");
      return;
    }

    setLoading(true);

    try {
      const tagsPayload = tags.length > 0 ? tags : undefined;

      if (logMode === "day") {
        const result = await postEvent({
          rawText: text,
          logKind: "day",
          logDay,
          tags: tagsPayload,
        });
        toast.success(result.updated ? "Day summary updated." : "Day summary logged.");
      } else if (!isOnline() && logMode === "moment") {
        await enqueueOfflineEvent({ rawText: text, tags });
        toast.success("Saved offline. Will sync when you're back online.");
        rememberEventTags(tags);
        reset();
        onLogged?.();
        return;
      } else if (logMode === "past") {
        await postEvent({
          rawText: text,
          occurredAt: new Date(occurredAt).toISOString(),
          tags: tagsPayload,
        });
        toast.success("Past event logged.");
      } else {
        await postEvent({ rawText: text, tags: tagsPayload });
        toast.success("Event logged.");
      }

      rememberEventTags(tags);
      reset();
      onLogged?.();
      void flushOfflineQueue(postEvent).catch(() => undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      // iOS/Android keyboards can't do Shift+Enter — Return should add a new line.
      if (isCoarsePointerDevice()) return;

      event.preventDefault();
      void handleSubmit();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (logMode !== "moment") {
        setLogMode("moment");
        setOccurredAt("");
        return;
      }
      reset();
      textareaRef.current?.blur();
    }
  }

  const isDayMode = logMode === "day";

  return (
    <div ref={containerRef} className="mb-9">
      <form
        onSubmit={handleSubmit}
        aria-busy={loading}
        className={cn(
          "transition-all duration-200 ease-out",
          expanded ? "surface-composer-expanded" : "surface-composer hover:shadow-[var(--shadow-soft)]",
          loading && "pointer-events-none opacity-90",
        )}
      >
        <div className={cn("px-4 transition-all", expanded ? "pt-4 pb-3" : "py-3")}>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={handleKeyDown}
            enterKeyHint="enter"
            placeholder={
              isDayMode
                ? "How was your day? One summary covers the whole day."
                : "What happened?"
            }
            rows={expanded ? (isDayMode ? 4 : 3) : 1}
            autoComplete="off"
            disabled={loading}
            className="min-h-0 resize-none border-0 bg-transparent px-0 py-0 text-[1.0625rem] leading-relaxed shadow-none transition-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
          />

          {expanded && (
            <InlineActivityChips
              className="animate-in-up mt-3"
              activities={activities}
              selectedIds={selectedActivityIds}
              onToggle={toggleActivity}
            />
          )}

          {expanded && logMode === "past" && (
            <div className="animate-in-up mt-3 flex min-w-0 items-center gap-2.5 border-t border-border pt-3">
              <Clock className="size-4 shrink-0 text-primary" />
              <Input
                type="datetime-local"
                enterKeyHint="done"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="h-11 min-w-0 flex-1 border-border bg-background text-base sm:max-w-xs sm:text-sm"
              />
            </div>
          )}

          {expanded && logMode === "day" && (
            <div className="animate-in-up mt-3 flex min-w-0 items-center gap-2.5 border-t border-border pt-3">
              <CalendarDays className="size-4 shrink-0 text-primary" />
              <Input
                type="date"
                enterKeyHint="done"
                value={logDay}
                max={todayDateInputValue()}
                onChange={(e) => setLogDay(e.target.value)}
                className="h-11 min-w-0 flex-1 border-border bg-background text-base sm:max-w-xs sm:text-sm"
              />
            </div>
          )}

          {expanded && (
            <div className="animate-in-up mt-3 border-t border-border pt-3">
              <EventTagsField value={tags} onChange={setTags} />
            </div>
          )}
        </div>

        {expanded && (
          <div className="flex flex-col gap-3 border-t border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={logMode === "day" ? "secondary" : "ghost"}
                size="sm"
                className="touch-manipulation gap-1.5 rounded-full font-normal text-muted-foreground active:scale-[0.98] active:bg-muted/80 data-[active=true]:text-foreground"
                data-active={logMode === "day"}
                onClick={() => switchLogMode(logMode === "day" ? "moment" : "day")}
              >
                <CalendarDays className="size-3.5" />
                Day log
              </Button>
              <Button
                type="button"
                variant={logMode === "past" ? "secondary" : "ghost"}
                size="sm"
                className="touch-manipulation gap-1.5 rounded-full font-normal text-muted-foreground active:scale-[0.98] active:bg-muted/80 data-[active=true]:text-foreground"
                data-active={logMode === "past"}
                onClick={() => switchLogMode(logMode === "past" ? "moment" : "past")}
              >
                <Clock className="size-3.5" />
                Past time
              </Button>
              <span className="hidden text-xs text-muted-foreground/90 sm:inline">
                {isDayMode
                  ? "One summary for the day · Enter to save"
                  : isCoarsePointerDevice()
                    ? "Tap Log to save · Return for new line"
                    : "Enter to log · Shift+Enter for new line"}
              </span>
            </div>

            <Button
              type="submit"
              size="sm"
              data-loading={loading ? "" : undefined}
              className="h-11 w-full min-w-[7.5rem] touch-manipulation rounded-full px-5 sm:ml-auto sm:h-8 sm:w-auto"
              disabled={
                loading ||
                !text.trim() ||
                (logMode === "past" && !occurredAt) ||
                (logMode === "day" && !logDay)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isDayMode ? "Logging day…" : "Logging…"}
                </>
              ) : isDayMode ? (
                "Log day"
              ) : (
                "Log"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
