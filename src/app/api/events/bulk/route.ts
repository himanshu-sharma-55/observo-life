import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { createEventTagsSchema } from "@/lib/events/schemas";
import { createBulkEvents } from "@/lib/events/service";

const bulkSchema = z.object({
  rawText: z.string().min(1).max(10000),
  occurredAt: z.string().datetime().optional(),
  tags: createEventTagsSchema,
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid bulk event data" }, { status: 400 });
    }

    const result = await createBulkEvents(
      userId,
      parsed.data.rawText,
      parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      "INR",
      parsed.data.tags,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to create bulk events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
