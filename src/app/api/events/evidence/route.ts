import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";
import { serializeEventForApi } from "@/lib/events/service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 10);
    if (ids.length === 0) {
      return NextResponse.json({ events: [] });
    }

    await connectToDatabase();

    const docs = await Event.find({
      _id: { $in: ids },
      userId,
      deletedAt: null,
    })
      .sort({ occurredAt: -1 })
      .lean();

    const events = docs.map((doc) => serializeEventForApi(doc));

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch evidence" }, { status: 500 });
  }
}
