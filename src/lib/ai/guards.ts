import { connectToDatabase } from "@/lib/db";
import { MonthRecap, UserSettings } from "@/lib/db/models";
import {
  AI_LOCK_TTL_MS,
  MAX_RECAP_GENERATE_PER_HOUR,
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

/** Kept for API compatibility — manual feed generation is not rate-limited. */
export async function assertFeedAiAllowed(_userId: string) {
  await connectToDatabase();
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
