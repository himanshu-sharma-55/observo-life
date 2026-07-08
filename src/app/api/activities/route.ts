import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { createEventTagsSchema } from "@/lib/events/schemas";
import { createSavedActivity, listSavedActivities } from "@/lib/activities/service";

const createSchema = z.object({
  title: z.string().min(1).max(120),
  text: z.string().max(500).optional(),
  tags: createEventTagsSchema,
});

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;

    const activities = await listSavedActivities(userId, q);
    return NextResponse.json({ activities });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid activity data" }, { status: 400 });
    }

    const activity = await createSavedActivity(userId, parsed.data);
    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to create activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
