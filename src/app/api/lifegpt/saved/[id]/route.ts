import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { LifeGptSaved } from "@/lib/db/models";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await connectToDatabase();
    const updated = await LifeGptSaved.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Saved note not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to delete saved note" }, { status: 500 });
  }
}
