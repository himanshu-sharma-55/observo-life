"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import { cn } from "@/lib/utils";

export async function fetchSavedActivities(
  query?: string,
): Promise<SerializedSavedActivity[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);

  const response = await fetch(`/api/activities?${params.toString()}`);
  if (!response.ok) return [];

  const data = (await response.json()) as { activities?: SerializedSavedActivity[] };
  return data.activities ?? [];
}

export function useSavedActivities(enabled: boolean) {
  const [activities, setActivities] = useState<SerializedSavedActivity[]>([]);

  useEffect(() => {
    if (!enabled) return;
    void fetchSavedActivities().then(setActivities);
  }, [enabled]);

  return activities;
}

type InlineActivityChipsProps = {
  activities: SerializedSavedActivity[];
  selectedIds: string[];
  onToggle: (activity: SerializedSavedActivity) => void;
  className?: string;
};

export function InlineActivityChips({
  activities,
  selectedIds,
  onToggle,
  className,
}: InlineActivityChipsProps) {
  if (activities.length === 0) return null;

  const selectedSet = new Set(selectedIds);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activities.map((activity) => {
          const active = selectedSet.has(activity.id);
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => onToggle(activity)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {activity.title}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tap to add ·{" "}
        <Link href="/activities" className="text-primary hover:underline">
          Manage
        </Link>
      </p>
    </div>
  );
}
