import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { UserSettings } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";

const settingsSchema = z.object({
  timezone: z.string().optional(),
  analysisIntervalDays: z.number().int().min(1).max(365).optional(),
  analysisAnchorDay: z.string().optional(),
  currency: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    await connectToDatabase();

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { ...parsed.data, updatedAt: new Date() } },
      { new: true, upsert: true },
    );

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
