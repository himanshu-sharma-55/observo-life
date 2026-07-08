import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/db/models";
import type { MonthRecapStats } from "@/lib/db/models";
import { getMonthBounds, previousMonthKey } from "@/lib/dates/month";
import {
  extractSignals,
  formatSignalLabel,
  percentChange,
  SIGNAL_MAP,
} from "@/lib/aggregates/signals";

export type EventRow = {
  id: string;
  userId: string;
  rawText: string;
  occurredAt: Date;
  logKind: "moment" | "day";
  amount: number | null;
  currency: string | null;
};

export type SignalAggregate = {
  signal: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
  evidenceEventIds: string[];
};

export type SpendingAggregate = {
  currentTotal: number;
  previousTotal: number;
  currentCount: number;
  previousCount: number;
  changePercent: number | null;
  evidenceEventIds: string[];
};

export type PeriodAggregates = {
  periodStart: Date;
  periodEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  currentEvents: EventRow[];
  previousEvents: EventRow[];
  todayCount: number;
  currentCount: number;
  previousCount: number;
  signalCounts: SignalAggregate[];
  spending: SpendingAggregate;
  dailyCounts: { day: string; count: number }[];
  topTerms: { term: string; count: number }[];
};

export async function loadEventsForRange(
  userId: string,
  from: Date,
  to: Date,
): Promise<EventRow[]> {
  await connectToDatabase();

  const docs = await Event.find({
    userId,
    deletedAt: null,
    occurredAt: { $gte: from, $lte: to },
  }).sort({ occurredAt: -1 });

  return docs.map((doc) => ({
    id: doc.id,
    userId: doc.userId,
    rawText: doc.rawText,
    occurredAt: doc.occurredAt,
    logKind: doc.logKind === "day" ? "day" : "moment",
    amount: doc.amount ?? null,
    currency: doc.currency ?? null,
  }));
}

export async function getPeriodAggregates(
  userId: string,
  periodDays = 7,
): Promise<PeriodAggregates> {
  const now = new Date();
  const periodEnd = endOfDay(now);
  const periodStart = startOfDay(subDays(now, periodDays));
  const previousStart = startOfDay(subDays(periodStart, periodDays));
  const previousEnd = endOfDay(subDays(periodStart, 1));
  const todayStart = startOfDay(now);

  const [currentEvents, previousEvents, todayEvents] = await Promise.all([
    loadEventsForRange(userId, periodStart, periodEnd),
    loadEventsForRange(userId, previousStart, previousEnd),
    loadEventsForRange(userId, todayStart, periodEnd),
  ]);

  const signalCounts = buildSignalCounts(currentEvents, previousEvents);
  const spending = buildSpendingAggregate(currentEvents, previousEvents);
  const dailyCounts = buildDailyCounts(currentEvents);
  const topTerms = buildTopTerms(currentEvents);

  return {
    periodStart,
    periodEnd,
    previousStart,
    previousEnd,
    currentEvents,
    previousEvents,
    todayCount: todayEvents.length,
    currentCount: currentEvents.length,
    previousCount: previousEvents.length,
    signalCounts,
    spending,
    dailyCounts,
    topTerms,
  };
}

function buildSignalCounts(currentEvents: EventRow[], previousEvents: EventRow[]) {
  const map = new Map<string, SignalAggregate>();

  for (const signal of Object.keys(SIGNAL_MAP)) {
    map.set(signal, {
      signal,
      label: formatSignalLabel(signal),
      current: 0,
      previous: 0,
      changePercent: null,
      evidenceEventIds: [],
    });
  }

  for (const event of currentEvents) {
    for (const signal of extractSignals(event.rawText)) {
      const entry = map.get(signal);
      if (!entry) continue;
      entry.current += 1;
      if (entry.evidenceEventIds.length < 5) entry.evidenceEventIds.push(event.id);
    }
  }

  for (const event of previousEvents) {
    for (const signal of extractSignals(event.rawText)) {
      const entry = map.get(signal);
      if (!entry) continue;
      entry.previous += 1;
    }
  }

  for (const entry of map.values()) {
    entry.changePercent = percentChange(entry.current, entry.previous);
  }

  return [...map.values()]
    .filter((entry) => entry.current > 0 || entry.previous > 0)
    .sort((a, b) => b.current - a.current);
}

function buildSpendingAggregate(
  currentEvents: EventRow[],
  previousEvents: EventRow[],
): SpendingAggregate {
  const currentSpendingEvents = currentEvents.filter((event) => event.amount);
  const previousSpendingEvents = previousEvents.filter((event) => event.amount);

  const currentTotal = currentSpendingEvents.reduce(
    (sum, event) => sum + Number(event.amount),
    0,
  );
  const previousTotal = previousSpendingEvents.reduce(
    (sum, event) => sum + Number(event.amount),
    0,
  );

  return {
    currentTotal,
    previousTotal,
    currentCount: currentSpendingEvents.length,
    previousCount: previousSpendingEvents.length,
    changePercent: percentChange(currentTotal, previousTotal),
    evidenceEventIds: currentSpendingEvents.slice(0, 5).map((event) => event.id),
  };
}

function buildDailyCounts(currentEvents: EventRow[]) {
  const counts = new Map<string, number>();

  for (const event of currentEvents) {
    const day = format(new Date(event.occurredAt), "EEEE");
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTopTerms(currentEvents: EventRow[]) {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "to",
    "for",
    "with",
    "had",
    "have",
    "was",
    "were",
    "my",
    "i",
    "on",
    "in",
    "at",
    "it",
    "today",
    "yesterday",
  ]);

  const counts = new Map<string, number>();

  for (const event of currentEvents) {
    const words = event.rawText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));

    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export type WeekRollup = {
  weekStart: string;
  weekEnd: string;
  eventCount: number;
  signalCounts: { signal: string; label: string; count: number }[];
  spendingTotal: number;
};

export async function getMultiWeekRollups(userId: string, weeks = 8): Promise<WeekRollup[]> {
  const now = new Date();
  const rollups: WeekRollup[] = [];

  for (let i = 0; i < weeks; i++) {
    const weekEnd = endOfDay(subDays(now, i * 7));
    const weekStart = startOfDay(subDays(weekEnd, 6));
    const events = await loadEventsForRange(userId, weekStart, weekEnd);

    const signalMap = new Map<string, { signal: string; label: string; count: number }>();
    for (const event of events) {
      for (const signal of extractSignals(event.rawText)) {
        const existing = signalMap.get(signal);
        if (existing) existing.count += 1;
        else
          signalMap.set(signal, {
            signal,
            label: formatSignalLabel(signal),
            count: 1,
          });
      }
    }

    const spendingTotal = events
      .filter((e) => e.amount)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    rollups.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      eventCount: events.length,
      signalCounts: [...signalMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
      spendingTotal,
    });
  }

  return rollups.reverse();
}

export async function getMonthStats(
  userId: string,
  monthKey: string,
  timezone = "UTC",
): Promise<MonthRecapStats> {
  const { start, end } = getMonthBounds(monthKey, timezone);
  const events = await loadEventsForRange(userId, start, end);

  const prevKey = previousMonthKey(monthKey);
  const prevBounds = getMonthBounds(prevKey, timezone);
  const prevEvents = await loadEventsForRange(userId, prevBounds.start, prevBounds.end);

  const activeDays = new Set(
    events.map((e) => format(new Date(e.occurredAt), "yyyy-MM-dd")),
  ).size;

  const prevActiveDays = new Set(
    prevEvents.map((e) => format(new Date(e.occurredAt), "yyyy-MM-dd")),
  ).size;

  const dayCounts = new Map<string, number>();
  for (const event of events) {
    const day = format(new Date(event.occurredAt), "EEEE");
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
  }

  const busiestEntry = [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const busiestDay = busiestEntry
    ? { day: busiestEntry[0], count: busiestEntry[1] }
    : null;

  const signalMap = new Map<string, { signal: string; label: string; count: number }>();
  for (const event of events) {
    for (const signal of extractSignals(event.rawText)) {
      const existing = signalMap.get(signal);
      if (existing) existing.count += 1;
      else signalMap.set(signal, { signal, label: formatSignalLabel(signal), count: 1 });
    }
  }

  const spendingEvents = events.filter((e) => e.amount);
  const prevSpending = prevEvents
    .filter((e) => e.amount)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const spendingTotal = spendingEvents.reduce((sum, e) => sum + Number(e.amount), 0);

  const daysInMonth = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

  // Weekly rhythm: split month into ~4 buckets
  const bucketSize = Math.max(1, Math.ceil(daysInMonth / 4));
  const weeklyRhythm: { week: number; count: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const bucketStart = new Date(start.getTime() + w * bucketSize * 24 * 60 * 60 * 1000);
    const bucketEnd = new Date(
      Math.min(end.getTime(), bucketStart.getTime() + bucketSize * 24 * 60 * 60 * 1000),
    );
    const count = events.filter(
      (e) => e.occurredAt >= bucketStart && e.occurredAt <= bucketEnd,
    ).length;
    weeklyRhythm.push({ week: w + 1, count });
  }

  const pctChange = (current: number, previous: number) =>
    previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

  return {
    totalEvents: events.length,
    activeDays,
    daysInMonth,
    busiestDay,
    vsLastMonth: {
      events: prevEvents.length > 0 ? pctChange(events.length, prevEvents.length) : null,
      activeDays:
        prevActiveDays > 0 ? pctChange(activeDays, prevActiveDays) : null,
      spending: prevSpending > 0 ? pctChange(spendingTotal, prevSpending) : null,
    },
    topSignals: [...signalMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
    spending: { total: spendingTotal, count: spendingEvents.length },
    weeklyRhythm,
    firstEventAt: events.length > 0 ? events[events.length - 1].occurredAt : null,
    lastEventAt: events.length > 0 ? events[0].occurredAt : null,
    isFirstMonth: prevEvents.length === 0,
  };
}
