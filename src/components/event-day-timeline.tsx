"use client";

import { format } from "date-fns";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import { EventTagsField } from "@/components/event-tags-field";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventText } from "@/components/event-text";
import { ConfirmPopover } from "@/components/confirm-popover";
import { InlineActivityChips } from "@/components/inline-activities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DayEventGroup, TimelineEvent } from "@/lib/events/group-by-day";
import { timelineNodeStyle } from "@/lib/events/timeline-node-style";
import { cn } from "@/lib/utils";

type EventDayTimelineProps = {
  groups: DayEventGroup[];
  editingId: string | null;
  draft: string;
  tagsDraft: string[];
  selectedActivityIds: string[];
  savingId: string | null;
  activities: SerializedSavedActivity[];
  onDraftChange: (value: string) => void;
  onTagsDraftChange: (tags: string[]) => void;
  onToggleActivity: (activity: SerializedSavedActivity) => void;
  onStartEdit: (event: TimelineEvent) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
};

function formatNodeTime(event: TimelineEvent): string {
  if (event.logKind === "day") {
    return "Day";
  }
  return format(new Date(event.occurredAt), "h:mm a");
}

function dayGroupCountLabel(group: DayEventGroup): string {
  const momentCount = group.events.filter((event) => event.logKind === "moment").length;
  const daySummaryCount = group.events.filter((event) => event.logKind === "day").length;

  if (momentCount > 0 && daySummaryCount > 0) {
    return `${momentCount} moment${momentCount === 1 ? "" : "s"} · day summary`;
  }
  if (daySummaryCount > 0) {
    return "Day summary";
  }
  return `${momentCount} log${momentCount === 1 ? "" : "s"}`;
}

function NodeActions({
  event,
  onStartEdit,
  onDelete,
  className,
}: {
  event: TimelineEvent;
  onStartEdit: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={event.logKind === "day" ? "Edit day summary" : "Edit event"}
        className="touch-manipulation hover:bg-muted hover:text-foreground"
        onClick={() => onStartEdit(event)}
      >
        <Pencil className="size-4" />
      </Button>
      <ConfirmPopover
        title={event.logKind === "day" ? "Delete this day summary?" : "Delete this event?"}
        description="It will be removed from your log."
        onConfirm={() => onDelete(event.id)}
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={event.logKind === "day" ? "Delete day summary" : "Delete event"}
            className="touch-manipulation hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
      />
    </div>
  );
}

function TimelineNode({
  event,
  isLast,
  isEditing,
  isSaving,
  draft,
  tagsDraft,
  selectedActivityIds,
  activities,
  onDraftChange,
  onTagsDraftChange,
  onToggleActivity,
  onCancelEdit,
  onSaveEdit,
  onStartEdit,
  onDelete,
  onTagClick,
}: {
  event: TimelineEvent;
  isLast: boolean;
  isEditing: boolean;
  isSaving: boolean;
  draft: string;
  tagsDraft: string[];
  selectedActivityIds: string[];
  activities: SerializedSavedActivity[];
  onDraftChange: (value: string) => void;
  onTagsDraftChange: (tags: string[]) => void;
  onToggleActivity: (activity: SerializedSavedActivity) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  onStartEdit: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
}) {
  const style = timelineNodeStyle(event.logKind);

  return (
    <article className={cn("group/node", !isLast && "pb-6 sm:pb-5")}>
      {isEditing ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 sm:p-4">
          <div className="flex items-center justify-between sm:hidden">
            <span className={cn("text-xs font-medium tabular-nums", style.timeClass)}>
              {formatNodeTime(event)}
            </span>
          </div>
          <Textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={event.logKind === "day" ? 4 : 2}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSaveEdit(event.id);
              }
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <InlineActivityChips
            activities={activities}
            selectedIds={selectedActivityIds}
            onToggle={onToggleActivity}
          />
          <EventTagsField value={tagsDraft} onChange={onTagsDraftChange} />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="touch-manipulation"
              onClick={() => onSaveEdit(event.id)}
              disabled={isSaving || !draft.trim()}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="touch-manipulation"
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between sm:hidden">
            <span className={cn("text-xs font-medium tabular-nums", style.timeClass)}>
              {formatNodeTime(event)}
            </span>
            <NodeActions event={event} onStartEdit={onStartEdit} onDelete={onDelete} />
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="hidden w-14 shrink-0 flex-col items-end pt-0.5 sm:flex">
              <span
                className={cn(
                  "text-right text-xs font-medium leading-tight tabular-nums",
                  style.timeClass,
                )}
              >
                {formatNodeTime(event)}
              </span>
            </div>

            <div className="relative hidden w-2.5 shrink-0 flex-col items-center sm:flex">
              <span
                className={cn(
                  "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-background",
                  style.dotClass,
                )}
                aria-hidden
              />
              {!isLast ? (
                <span className="absolute top-3 bottom-0 w-px bg-border" aria-hidden />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <EventText>{event.rawText}</EventText>
                  <EventTagsBadges tags={event.tags} onTagClick={onTagClick} />
                  {event.amount ? (
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      {event.currency === "USD" ? "$" : "₹"}
                      {Number(event.amount).toLocaleString()}
                    </Badge>
                  ) : null}
                </div>

                <NodeActions
                  event={event}
                  onStartEdit={onStartEdit}
                  onDelete={onDelete}
                  className="hidden sm:flex opacity-0 transition-opacity duration-150 group-hover/node:opacity-100 group-focus-within/node:opacity-100"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

export function EventDayTimeline({
  groups,
  editingId,
  draft,
  tagsDraft,
  selectedActivityIds,
  savingId,
  activities,
  onDraftChange,
  onTagsDraftChange,
  onToggleActivity,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onTagClick,
}: EventDayTimelineProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {groups.map((group, groupIndex) => (
        <section
          key={group.dayKey}
          className="surface-card animate-in-up overflow-hidden"
          style={{ animationDelay: `${Math.min(groupIndex, 8) * 30}ms` }}
        >
          <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border/80 bg-muted/20 px-4 py-3 sm:px-5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[0.9375rem]">
              {group.label}
            </h2>
            <p className="text-xs text-muted-foreground">{dayGroupCountLabel(group)}</p>
          </header>

          <div className="px-4 py-5 sm:px-4 sm:py-5">
            {group.events.map((event, index) => (
              <TimelineNode
                key={event.id}
                event={event}
                isLast={index === group.events.length - 1}
                isEditing={editingId === event.id}
                isSaving={savingId === event.id}
                draft={draft}
                tagsDraft={tagsDraft}
                selectedActivityIds={selectedActivityIds}
                activities={activities}
                onDraftChange={onDraftChange}
                onTagsDraftChange={onTagsDraftChange}
                onToggleActivity={onToggleActivity}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onDelete={onDelete}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
