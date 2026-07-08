import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MonthRecap } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";
import { monthLabel } from "@/lib/dates/month";

export async function GET() {
  try {
    const userId = await requireUserId();
    await connectToDatabase();

    const recaps = await MonthRecap.find({ userId, headline: { $ne: "" } })
      .sort({ month: -1 })
      .lean();

    return NextResponse.json({
      recaps: recaps.map((r) => ({
        month: r.month,
        label: monthLabel(r.month),
        headline: r.headline,
        generatedAt: r.generatedAt,
        viewedAt: r.viewedAt,
        totalEvents: r.stats?.totalEvents ?? 0,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to list recaps" }, { status: 500 });
  }
}
