import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MonthRecap } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  try {
    const userId = await requireUserId();
    const { month } = await params;

    await connectToDatabase();

    const recap = await MonthRecap.findOne({ userId, month }).lean();
    if (!recap?.headline) {
      return NextResponse.json({ error: "Recap not found" }, { status: 404 });
    }

    return NextResponse.json({ recap });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch recap" }, { status: 500 });
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ month: string }> },
) {
  try {
    const userId = await requireUserId();
    const { month } = await params;

    await connectToDatabase();

    const recap = await MonthRecap.findOneAndUpdate(
      { userId, month },
      { $set: { viewedAt: new Date() } },
      { new: true },
    );

    if (!recap) {
      return NextResponse.json({ error: "Recap not found" }, { status: 404 });
    }

    return NextResponse.json({ recap });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to update recap" }, { status: 500 });
  }
}
