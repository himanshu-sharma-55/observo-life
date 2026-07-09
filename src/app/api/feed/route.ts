import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AnalysisRun, FeedItem } from "@/lib/db/models";
import type { FeedScope } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db/serialize";
import { serializeFeedItem } from "@/lib/feed/serialize-item";
import { FEED_PAGE_SIZE, hasMoreResults } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") ?? "current") as FeedScope;
    const limitParam = searchParams.get("limit");
    const skipParam = searchParams.get("skip");
    const limit = limitParam ? Number(limitParam) : FEED_PAGE_SIZE;
    const skip = skipParam ? Number(skipParam) : 0;

    if (scope !== "current" && scope !== "overall") {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    await connectToDatabase();

    const latestRun = await AnalysisRun.findOne({ userId }).sort({ createdAt: -1 }).lean();

    if (!latestRun) {
      return NextResponse.json({ scope, run: null, items: [] });
    }

    let items = await FeedItem.find({
      userId,
      source: "ai",
      feedScope: scope,
      analysisRunId: String(latestRun._id),
      dismissedAt: null,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Fallback for legacy items without run linkage
    if (items.length === 0 && skip === 0) {
      items = await FeedItem.find({
        userId,
        source: "ai",
        feedScope: scope,
        dismissedAt: null,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    return NextResponse.json({
      scope,
      run: {
        id: String(latestRun._id),
        sequence: latestRun.sequence,
        createdAt: latestRun.createdAt,
        periodStart: latestRun.periodStart,
        periodEnd: latestRun.periodEnd,
        overallWindowWeeks: latestRun.summary?.overallWeeks ?? 8,
      },
      items: items.map((item) => serializeFeedItem(item)),
      hasMore: hasMoreResults(items.length, limit),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[api/feed GET]", error);
    return NextResponse.json(
      { error: dbErrorMessage(error, "Failed to fetch feed") },
      { status: 500 },
    );
  }
}
