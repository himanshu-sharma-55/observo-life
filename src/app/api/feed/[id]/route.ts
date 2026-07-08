import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { FeedItem } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    await connectToDatabase();

    const item = await FeedItem.findOneAndUpdate(
      { _id: id, userId, dismissedAt: null },
      { $set: { dismissedAt: new Date() } },
      { new: true },
    );

    if (!item) {
      return NextResponse.json({ error: "Feed item not found" }, { status: 404 });
    }

    return NextResponse.json({ id: item.id });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to dismiss item" }, { status: 500 });
  }
}
