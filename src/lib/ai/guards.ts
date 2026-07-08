import { connectToDatabase } from "@/lib/db";
import { AnalysisRun, MonthRecap, UserSettings } from "@/lib/db/models";
import {
  AI_LOCK_TTL_MS,
  MAX_FEED_AI_PER_HOUR,
  MAX_RECAP_GENERATE_PER_HOUR,
  MIN_FEED_COOLDOWN_MS,
} from "@/lib/ai/constants";

export class AiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRateLimitError";
  }
}

export class AiLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiLockError";
  }
}

function formatWaitMinutes(ms: number) {
  const minutes = Math.ceil(ms / 60_000);
  return minutes <= 1 ? "1 minute" : `${minutes} minutes`;
}

export async function assertFeedAiAllowed(userId: string) {
  await connectToDatabase();

  const [settings, latestRun, recentHourCount] = await Promise.all([
    UserSettings.findOne({ userId }).lean(),
    AnalysisRun.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    AnalysisRun.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    }),
  ]);

  if (recentHourCount >= MAX_FEED_AI_PER_HOUR) {
    throw new AiRateLimitError("Too many AI insight requests this hour. Try again later.");
  }

  if (latestRun?.createdAt) {
    const msSince = Date.now() - new Date(latestRun.createdAt).getTime();

    if (msSince < MIN_FEED_COOLDOWN_MS) {
      throw new AiRateLimitError(
        `Please wait ${formatWaitMinutes(MIN_FEED_COOLDOWN_MS - msSince)} before generating again.`,
      );
    }

    const intervalDays = Math.max(1, settings?.analysisIntervalDays ?? 7);
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    if (msSince < intervalMs) {
      const daysLeft = Math.ceil((intervalMs - msSince) / (24 * 60 * 60 * 1000));
      throw new AiRateLimitError(
        `Your minimum interval is ${intervalDays} day${intervalDays === 1 ? "" : "s"}. Try again in about ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
      );
    }
  }
}

export async function acquireFeedAiLock(userId: string): Promise<() => Promise<void>> {
  await connectToDatabase();

  await UserSettings.updateOne(
    { userId },
    {
      $setOnInsert: {
        userId,
        timezone: "UTC",
        analysisIntervalDays: 7,
        analysisAnchorDay: "sunday",
        currency: "INR",
        createdAt: new Date(),
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true },
  );

  const lockUntil = new Date(Date.now() + AI_LOCK_TTL_MS);
  const stale = new Date();

  const updated = await UserSettings.findOneAndUpdate(
    {
      userId,
      $or: [
        { aiFeedLockedUntil: { $exists: false } },
        { aiFeedLockedUntil: null },
        { aiFeedLockedUntil: { $lte: stale } },
      ],
    },
    { $set: { aiFeedLockedUntil: lockUntil, updatedAt: new Date() } },
    { new: true },
  );

  if (!updated) {
    throw new AiLockError("AI insights generation is already in progress. Please wait.");
  }

  return async () => {
    await UserSettings.updateOne(
      { userId },
      { $set: { aiFeedLockedUntil: null, updatedAt: new Date() } },
    );
  };
}

export async function assertRecapGenerateAllowed(userId: string) {
  await connectToDatabase();

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAttempts = await MonthRecap.countDocuments({
    userId,
    generatingAt: { $gte: hourAgo },
  });

  if (recentAttempts >= MAX_RECAP_GENERATE_PER_HOUR) {
    throw new AiRateLimitError("Too many recap generation attempts this hour. Try again later.");
  }
}

export async function acquireRecapGenerationLock(
  userId: string,
  monthKey: string,
): Promise<() => Promise<void>> {
  await connectToDatabase();

  const existing = await MonthRecap.findOne({ userId, month: monthKey }).lean();
  if (existing?.headline) {
    return async () => {};
  }

  const stale = new Date(Date.now() - AI_LOCK_TTL_MS);
  const now = new Date();

  const claimed = await MonthRecap.findOneAndUpdate(
    {
      userId,
      month: monthKey,
      headline: { $in: ["", null] },
      $or: [
        { generatingAt: { $exists: false } },
        { generatingAt: null },
        { generatingAt: { $lte: stale } },
      ],
    },
    {
      $set: { generatingAt: now },
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
        sections: [],
        surpriseInsights: [],
        compactInsights: [],
        sourceItemIds: [],
        generatedAt: now,
        model: "",
      },
    },
    { upsert: true, new: true },
  );

  if (!claimed) {
    throw new AiLockError("Month recap generation is already in progress. Please wait.");
  }

  return async () => {
    await MonthRecap.updateOne(
      { userId, month: monthKey, headline: { $in: ["", null] } },
      { $set: { generatingAt: null } },
    );
  };
}
