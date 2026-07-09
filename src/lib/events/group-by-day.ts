import { format, subDays } from "date-fns";
import { localDayStart } from "@/lib/dates/day-bounds";

export type TimelineEvent = {
  id: string;
  rawText: string;
  occurredAt: string;
  logKind: "moment" | "day";
  tags: string[];
  amount: string | null;
  currency: string | null;
};

export type DayEventGroup = {
  dayKey: string;
  label: string;
  events: TimelineEvent[];
};

export function formatDayGroupLabel(dayKey: string): string {
  const date = localDayStart(dayKey);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const yesterdayKey = format(subDays(new Date(), 1), "yyyy-MM-dd");

  if (dayKey === todayKey) {
    return `Today · ${format(date, "MMM d")}`;
  }
  if (dayKey === yesterdayKey) {
    return `Yesterday · ${format(date, "MMM d")}`;
  }
  return format(date, "EEEE, MMM d");
}

export function groupEventsByDay(
  events: TimelineEvent[],
  dayOrder: "asc" | "desc",
): DayEventGroup[] {
  const byDay = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const dayKey = format(new Date(event.occurredAt), "yyyy-MM-dd");
    const bucket = byDay.get(dayKey);
    if (bucket) {
      bucket.push(event);
    } else {
      byDay.set(dayKey, [event]);
    }
  }

  const dayKeys = [...byDay.keys()].sort((a, b) =>
    dayOrder === "desc" ? b.localeCompare(a) : a.localeCompare(b),
  );

  return dayKeys.map((dayKey) => {
    const dayEvents = byDay.get(dayKey) ?? [];
    dayEvents.sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    return {
      dayKey,
      label: formatDayGroupLabel(dayKey),
      events: dayEvents,
    };
  });
}
