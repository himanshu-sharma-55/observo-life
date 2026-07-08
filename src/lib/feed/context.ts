import { connectToDatabase } from "@/lib/db";
import { AnalysisRun, FeedItem, MonthRecap } from "@/lib/db/models";
import type { FeedScope, RecapInsight } from "@/lib/db/models";

export async function getNextRunSequence(userId: string): Promise<number> {
  await connectToDatabase();
  const latest = await AnalysisRun.findOne({ userId }).sort({ sequence: -1 }).lean();
  return (latest?.sequence ?? 0) + 1;
}

export async function getLastRunInsights(
  userId: string,
  scope: FeedScope,
): Promise<RecapInsight[]> {
  await connectToDatabase();
  const run = await AnalysisRun.findOne({ userId }).sort({ createdAt: -1 }).lean();
  if (!run) return [];
  return scope === "current"
    ? (run.currentInsights ?? [])
    : (run.overallInsights ?? []);
}

export async function getRecentOverallInsights(
  userId: string,
  limitRuns = 2,
): Promise<RecapInsight[]> {
  await connectToDatabase();
  const runs = await AnalysisRun.find({ userId }).sort({ createdAt: -1 }).limit(limitRuns).lean();
  return runs.flatMap((run) => run.overallInsights ?? []);
}

export async function getWarmCompactInsights(userId: string, months = 6): Promise<RecapInsight[]> {
  await connectToDatabase();
  const recaps = await MonthRecap.find({ userId })
    .sort({ month: -1 })
    .limit(months)
    .lean();
  return recaps.flatMap((r) => r.compactInsights ?? []);
}

export async function getLatestRun(userId: string) {
  await connectToDatabase();
  return AnalysisRun.findOne({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getOverallItemsForMonth(
  userId: string,
  monthStart: Date,
  monthEnd: Date,
  limit = 50,
) {
  await connectToDatabase();
  return FeedItem.find({
    userId,
    feedScope: "overall",
    source: "ai",
    createdAt: { $gte: monthStart, $lte: monthEnd },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
