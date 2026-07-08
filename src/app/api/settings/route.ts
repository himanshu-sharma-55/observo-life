import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserSettings } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";

export async function GET() {
  try {
    const userId = await requireUserId();

    await connectToDatabase();

    const settings = await UserSettings.findOne({ userId });

    return NextResponse.json({ settings: settings ?? null });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
