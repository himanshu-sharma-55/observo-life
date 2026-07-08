import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { patchEventTagsSchema } from "@/lib/events/schemas";
import { serializeEventForApi, softDeleteEvent, updateEvent } from "@/lib/events/service";

const patchEventSchema = z
  .object({
    rawText: z.string().min(1).max(2000).optional(),
    occurredAt: z.string().datetime().optional(),
    tags: patchEventTagsSchema,
  })
  .refine(
    (data) =>
      data.rawText !== undefined ||
      data.occurredAt !== undefined ||
      data.tags !== undefined,
    { message: "Nothing to update" },
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();
    const parsed = patchEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid event data" },
        { status: 400 },
      );
    }

    const event = await updateEvent(userId, id, {
      rawText: parsed.data.rawText,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      tags: parsed.data.tags,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: serializeEventForApi(event) });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const event = await softDeleteEvent(userId, id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
