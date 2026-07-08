import { connectToDatabase } from "@/lib/db";
import {
  FeedItem,
  Hypothesis,
  MonthRecap,
  UserSettings,
  Want,
} from "@/lib/db/models";
import { generateStructured } from "@/lib/ai/client";
import {
  PROMPT_VERSION,
  RECAP_EVENT_SAMPLE_SIZE,
  RECAP_MAX_HYPOTHESES,
  RECAP_MAX_MONTH_OVERALL_ITEMS,
  RECAP_MAX_WANTS,
} from "@/lib/ai/constants";
import {
  acquireRecapGenerationLock,
  assertRecapGenerateAllowed,
} from "@/lib/ai/guards";
import { truncateEventText } from "@/lib/ai/truncate";
import { getMonthStats, loadEventsForRange } from "@/lib/aggregates/pipeline";
import { getMonthBounds, monthLabel } from "@/lib/dates/month";
import { getOverallItemsForMonth, getRecentOverallInsights } from "@/lib/feed/context";
import { RECAP_SYSTEM, buildRecapPrompt } from "@/lib/feed/prompts/recap";
import {
  GEMINI_MODEL,
  RECAP_RESPONSE_SCHEMA,
  RecapResponseSchema,
  filterEvidence,
} from "@/lib/feed/schemas";

export const MIN_EVENTS_FOR_RECAP = 5;

export async function generateMonthRecap(userId: string, monthKey: string) {
  await connectToDatabase();

  const existing = await MonthRecap.findOne({ userId, month: monthKey }).lean();
  if (existing?.headline) {
    return { recap: existing, created: false };
  }

  await assertRecapGenerateAllowed(userId);
  const releaseLock = await acquireRecapGenerationLock(userId, monthKey);

  const startedAt = Date.now();

  try {
    const settings = await UserSettings.findOne({ userId }).lean();
    const timezone = settings?.timezone ?? "UTC";
    const stats = await getMonthStats(userId, monthKey, timezone);

    if (stats.totalEvents < MIN_EVENTS_FOR_RECAP) {
      throw new Error(`Need at least ${MIN_EVENTS_FOR_RECAP} events in ${monthLabel(monthKey)}.`);
    }

    const { start, end } = getMonthBounds(monthKey, timezone);
    const events = await loadEventsForRange(userId, start, end);
    const eventSample = events.slice(0, RECAP_EVENT_SAMPLE_SIZE).map((e) => ({
      id: e.id,
      text: truncateEventText(e.rawText),
      occurredAt: new Date(e.occurredAt).toISOString(),
      logKind: e.logKind,
    }));

    const [wants, hypotheses, priorOverall, monthOverallItems] = await Promise.all([
      Want.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).limit(RECAP_MAX_WANTS).lean(),
      Hypothesis.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(RECAP_MAX_HYPOTHESES)
        .lean(),
      getRecentOverallInsights(userId, 3),
      getOverallItemsForMonth(userId, start, end, RECAP_MAX_MONTH_OVERALL_ITEMS),
    ]);

    const raw = await generateStructured({
      system: RECAP_SYSTEM,
      prompt: buildRecapPrompt({
        month: monthKey,
        monthLabel: monthLabel(monthKey),
        stats,
        events: eventSample,
        wants: wants.map((w) => ({ title: w.title, description: w.description })),
        hypotheses: hypotheses.map((h) => ({ statement: h.statement })),
        priorOverallInsights: priorOverall,
        latestOverallFeed: monthOverallItems.map((item) => {
          const metadata = item.metadata as Record<string, unknown> | null | undefined;
          return {
            type: item.type,
            title: typeof metadata?.title === "string" ? metadata.title : undefined,
            body: typeof metadata?.body === "string" ? metadata.body : item.content,
            takeaway: typeof metadata?.takeaway === "string" ? metadata.takeaway : undefined,
            content: item.content,
            evidenceEventIds: item.evidenceEventIds ?? [],
          };
        }),
      }),
      responseSchema: RECAP_RESPONSE_SCHEMA,
    });

    const parsed = RecapResponseSchema.parse(JSON.parse(raw));
    const validIds = new Set(events.map((e) => e.id));
    const surpriseInsights = filterEvidence(parsed.surpriseInsights, validIds);
    const compactInsights = filterEvidence(parsed.compactInsights, validIds);
    const durationMs = Date.now() - startedAt;

    const recap = await MonthRecap.findOneAndUpdate(
      { userId, month: monthKey, headline: { $in: ["", null] } },
      {
        $set: {
          stats,
          headline: parsed.headline.trim(),
          sections: parsed.sections,
          surpriseInsights,
          compactInsights,
          sourceItemIds: monthOverallItems.map((i) => String(i._id)),
          generatedAt: new Date(),
          generatingAt: null,
          model: GEMINI_MODEL,
        },
        $setOnInsert: { userId, month: monthKey, viewedAt: null },
      },
      { upsert: true, new: true },
    );

    if (!recap) {
      throw new Error("Could not save month recap.");
    }

    if (monthOverallItems.length > 0) {
      await FeedItem.updateMany(
        { _id: { $in: monthOverallItems.map((i) => i._id) } },
        { $set: { "metadata.compactedInto": String(recap._id) } },
      );
    }

    console.info("[ai] recap completed", {
      userId,
      month: monthKey,
      durationMs,
      model: GEMINI_MODEL,
      promptVersion: PROMPT_VERSION,
    });

    return { recap, created: true };
  } finally {
    await releaseLock();
  }
}

export async function getEligibleRecapMonth(userId: string) {
  await connectToDatabase();
  const settings = await UserSettings.findOne({ userId }).lean();
  const timezone = settings?.timezone ?? "UTC";

  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).format(now);

  const [y, m] = currentMonth.split("-").map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const monthKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;

  const existing = await MonthRecap.findOne({ userId, month: monthKey }).lean();
  if (existing?.headline) {
    return existing.viewedAt
      ? null
      : { month: monthKey, label: monthLabel(monthKey), generated: true };
  }

  const stats = await getMonthStats(userId, monthKey, timezone);
  if (stats.totalEvents < MIN_EVENTS_FOR_RECAP) return null;

  return {
    month: monthKey,
    label: monthLabel(monthKey),
    eventCount: stats.totalEvents,
    generated: false,
  };
}
