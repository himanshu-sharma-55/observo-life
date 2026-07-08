import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db/serialize";
import { createEventSchema } from "@/lib/events/schemas";
import { createEvent, listEvents, serializeEventForApi } from "@/lib/events/service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");
    const q = searchParams.get("q");
    const tag = searchParams.get("tag");
    const minAmount = searchParams.get("minAmount");
    const sortParam = searchParams.get("sort");
    const sort = sortParam === "asc" ? "asc" : "desc";

    const items = await listEvents(userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      q: q ?? undefined,
      tag: tag ?? undefined,
      minAmount: minAmount ? Number(minAmount) : undefined,
      sort,
    });

    return NextResponse.json({ events: items });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[api/events GET]", error);
    return NextResponse.json(
      { error: dbErrorMessage(error, "Failed to fetch events") },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid event data" },
        { status: 400 },
      );
    }

    const result = await createEvent(userId, {
      rawText: parsed.data.rawText,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      logKind: parsed.data.logKind,
      logDay: parsed.data.logDay,
      tags: parsed.data.tags,
    });

    return NextResponse.json(
      {
        event: serializeEventForApi(result.event),
        updated: result.updated,
      },
      { status: result.updated ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[api/events POST]", error);
    const message =
      error instanceof Error
        ? dbErrorMessage(error, error.message)
        : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
