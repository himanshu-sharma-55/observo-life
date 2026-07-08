import { endOfDay, startOfDay, subDays } from "date-fns";
import { connectToDatabase } from "@/lib/db";
import {
  AnalysisRun,
  FeedItem,
  Hypothesis,
  MonthRecap,
  UserSettings,
  Want,
} from "@/lib/db/models";
import { generateStructured } from "@/lib/ai/client";
import { PROMPT_VERSION, FEED_RUNS_TO_KEEP, RECAP_MAX_HYPOTHESES, RECAP_MAX_WANTS } from "@/lib/ai/constants";
import {
  acquireFeedAiLock,
  assertFeedAiAllowed,
} from "@/lib/ai/guards";
import {
  getMultiWeekRollups,
  getPeriodAggregates,
  loadEventsForRange,
} from "@/lib/aggregates/pipeline";
import { formatMonthKey, getMonthBounds } from "@/lib/dates/month";
import {
  getLastRunInsights,
  getNextRunSequence,
  getOverallItemsForMonth,
  getRecentOverallInsights,
  getWarmCompactInsights,
} from "@/lib/feed/context";
import { CURRENT_SYSTEM, buildCurrentPrompt } from "@/lib/feed/prompts/current";
import { OVERALL_SYSTEM, buildOverallPrompt } from "@/lib/feed/prompts/overall";
import {
  DEFAULT_AI_FEED_OPTIONS,
  type AiFeedOptions,
  type FeedPromptContext,
} from "@/lib/feed/ai-options";
import {
  GEMINI_MODEL,
  INSIGHTS_RESPONSE_SCHEMA,
  InsightsSchema,
  filterEvidence,
} from "@/lib/feed/schemas";

const OVERALL_WEEKS = 8;
const HOT_TIER_THRESHOLD = 15;

export type AiFeedResult = {
  currentInserted: number;
  overallInserted: number;
  runId?: string;
  sequence?: number;
  reason?: "no_data";
};

async function pruneOldFeedRuns(userId: string) {
  const runs = await AnalysisRun.find({ userId })
    .sort({ sequence: -1 })
    .skip(FEED_RUNS_TO_KEEP)
    .select("_id")
    .lean();

  const oldRunIds = runs.map((run) => String(run._id));
  if (oldRunIds.length === 0) return;

  await FeedItem.deleteMany({
    userId,
    analysisRunId: { $in: oldRunIds },
    "metadata.compactedInto": { $exists: false },
  });
  await AnalysisRun.deleteMany({ _id: { $in: oldRunIds } });
}

async function maybeInlineCompact(userId: string, timezone: string) {
  const hot = await getRecentOverallInsights(userId, 3);
  if (hot.length < HOT_TIER_THRESHOLD) return;

  const oldest = await FeedItem.findOne({
    userId,
    feedScope: "overall",
    source: "ai",
    "metadata.compactedInto": { $exists: false },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (!oldest?.createdAt) return;

  const monthKey = formatMonthKey(new Date(oldest.createdAt), timezone);
  const existing = await MonthRecap.findOne({ userId, month: monthKey }).lean();
  if (existing?.compactInsights?.length) return;

  const { start, end } = getMonthBounds(monthKey, timezone);
  const items = await getOverallItemsForMonth(userId, start, end);
  if (items.length === 0) return;

  const compactInsights = items.slice(0, 6).map((item) => {
    const metadata = item.metadata as Record<string, unknown> | null | undefined;
    const title = typeof metadata?.title === "string" ? metadata.title : undefined;
    const body = typeof metadata?.body === "string" ? metadata.body : item.content;
    const takeaway = typeof metadata?.takeaway === "string" ? metadata.takeaway : undefined;

    return {
      type: item.type,
      title,
      body,
      takeaway,
      content: item.content,
      evidenceEventIds: item.evidenceEventIds ?? [],
    };
  });

  await MonthRecap.findOneAndUpdate(
    { userId, month: monthKey },
    {
      $setOnInsert: {
        userId,
        month: monthKey,
        stats: {
          totalEvents: 0,
          activeDays: 0,
          daysInMonth: 30,
          busiestDay: null,
          vsLastMonth: { events: null, activeDays: null, spending: null },
          topSignals: [],
          spending: { total: 0, count: 0 },
          weeklyRhythm: [],
          firstEventAt: null,
          lastEventAt: null,
          isFirstMonth: false,
        },
        headline: "",
        sections: [],
        surpriseInsights: [],
        generatedAt: new Date(),
        model: GEMINI_MODEL,
      },
      $set: {
        compactInsights,
        sourceItemIds: items.map((i) => String(i._id)),
      },
    },
    { upsert: true },
  );

  await FeedItem.updateMany(
    { _id: { $in: items.map((i) => i._id) } },
    { $set: { "metadata.compactedInto": monthKey } },
  );
}

export async function generateAiFeed(
  userId: string,
  options: AiFeedOptions = DEFAULT_AI_FEED_OPTIONS,
): Promise<AiFeedResult> {
  await assertFeedAiAllowed(userId);
  const releaseLock = await acquireFeedAiLock(userId);

  const startedAt = Date.now();

  try {
    await connectToDatabase();

    const settings = await UserSettings.findOne({ userId }).lean();
    const timezone = settings?.timezone ?? "UTC";

    await maybeInlineCompact(userId, timezone);

    const aggregates = await getPeriodAggregates(userId, 7);
    const rollups = await getMultiWeekRollups(userId, OVERALL_WEEKS);
    const totalRollupEvents = rollups.reduce((sum, w) => sum + w.eventCount, 0);

    const runCurrent = options.includeCurrent && aggregates.currentCount > 0;
    const runOverall = options.includeOverall && totalRollupEvents > 0;

    if (!runCurrent && !runOverall) {
      return { currentInserted: 0, overallInserted: 0, reason: "no_data" };
    }

    const promptContext: FeedPromptContext = {};

    if (options.includeWants && (runCurrent || runOverall)) {
      const wants = await Want.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(RECAP_MAX_WANTS)
        .lean();
      if (wants.length > 0) {
        promptContext.wants = wants.map((want) => ({
          title: want.title,
          description: want.description,
        }));
      }
    }

    if (options.includeBeliefs && (runCurrent || runOverall)) {
      const beliefs = await Hypothesis.find({ userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(RECAP_MAX_HYPOTHESES)
        .lean();
      if (beliefs.length > 0) {
        promptContext.beliefs = beliefs.map((belief) => ({
          statement: belief.statement,
        }));
      }
    }

    const priorCurrent = await getLastRunInsights(userId, "current");
    const hotOverall = await getRecentOverallInsights(userId, 2);
    const warmCompact = await getWarmCompactInsights(userId, 6);

    let currentInsights: ReturnType<typeof filterEvidence> = [];
    let overallInsights: ReturnType<typeof filterEvidence> = [];

    if (runCurrent) {
      const rawCurrent = await generateStructured({
        system: CURRENT_SYSTEM,
        prompt: buildCurrentPrompt(aggregates, priorCurrent, promptContext),
        responseSchema: INSIGHTS_RESPONSE_SCHEMA,
      });
      const parsedCurrent = InsightsSchema.parse(JSON.parse(rawCurrent));
      const validCurrent = new Set(aggregates.currentEvents.map((e) => e.id));
      currentInsights = filterEvidence(parsedCurrent.insights, validCurrent);
    }

    if (runOverall) {
      const rawOverall = await generateStructured({
        system: OVERALL_SYSTEM,
        prompt: buildOverallPrompt({
          rollups,
          hotInsights: hotOverall,
          warmCompact,
          context: promptContext,
        }),
        responseSchema: INSIGHTS_RESPONSE_SCHEMA,
      });
      const parsedOverall = InsightsSchema.parse(JSON.parse(rawOverall));
      const windowStart = startOfDay(subDays(new Date(), OVERALL_WEEKS * 7));
      const windowEnd = endOfDay(new Date());
      const windowEvents = await loadEventsForRange(userId, windowStart, windowEnd);
      const validOverall = new Set(windowEvents.map((e) => e.id));
      overallInsights = filterEvidence(parsedOverall.insights, validOverall);
    }

    const sequence = await getNextRunSequence(userId);
    const previousRun = await AnalysisRun.findOne({ userId }).sort({ sequence: -1 }).lean();
    const generatedAt = new Date().toISOString();
    const durationMs = Date.now() - startedAt;

    const rows = [
      ...currentInsights.map((insight) => ({
        userId,
        feedScope: "current" as const,
        type: insight.type,
        content: insight.content,
        evidenceEventIds: insight.evidenceEventIds,
        source: "ai" as const,
        metadata: {
          generatedAt,
          cycleSequence: sequence,
          title: insight.title,
          body: insight.body,
          takeaway: insight.takeaway ?? null,
        },
      })),
      ...overallInsights.map((insight) => ({
        userId,
        feedScope: "overall" as const,
        type: insight.type,
        content: insight.content,
        evidenceEventIds: insight.evidenceEventIds,
        source: "ai" as const,
        metadata: {
          generatedAt,
          cycleSequence: sequence,
          title: insight.title,
          body: insight.body,
          takeaway: insight.takeaway ?? null,
        },
      })),
    ];

    let runId: string | undefined;

    try {
      const run = await AnalysisRun.create({
        userId,
        sequence,
        previousRunId: previousRun ? String(previousRun._id) : null,
        periodStart: aggregates.periodStart,
        periodEnd: aggregates.periodEnd,
        overallWindowStart: startOfDay(subDays(new Date(), OVERALL_WEEKS * 7)),
        overallWindowEnd: endOfDay(new Date()),
        currentInsights,
        overallInsights,
        model: GEMINI_MODEL,
        promptVersion: PROMPT_VERSION,
        durationMs,
        summary: {
          thisWeek: aggregates.currentCount,
          lastWeek: aggregates.previousCount,
          currentInsightCount: currentInsights.length,
          overallInsightCount: overallInsights.length,
          overallWeeks: OVERALL_WEEKS,
          options,
        },
      });

      runId = String(run._id);

      if (rows.length > 0) {
        await FeedItem.insertMany(
          rows.map((row) => ({ ...row, analysisRunId: runId })),
        );
      }
    } catch (error) {
      if (runId) {
        await AnalysisRun.deleteOne({ _id: runId }).catch(() => undefined);
        await FeedItem.deleteMany({ userId, analysisRunId: runId }).catch(() => undefined);
      }
      throw error;
    }

    await UserSettings.updateOne(
      { userId },
      { $set: { lastAnalysisAt: new Date(), updatedAt: new Date() } },
    );

    await pruneOldFeedRuns(userId);

    console.info("[ai] feed run completed", {
      userId,
      sequence,
      durationMs,
      currentInserted: currentInsights.length,
      overallInserted: overallInsights.length,
      model: GEMINI_MODEL,
      promptVersion: PROMPT_VERSION,
    });

    return {
      currentInserted: currentInsights.length,
      overallInserted: overallInsights.length,
      runId,
      sequence,
    };
  } finally {
    await releaseLock();
  }
}
