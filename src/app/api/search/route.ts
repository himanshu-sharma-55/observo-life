import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { listEvents } from "@/lib/events/service";

const searchSchema = z.object({
  q: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  minAmount: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    const parsed = searchSchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      minAmount: searchParams.get("minAmount") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
    }

    const events = await listEvents(userId, {
      q: parsed.data.q,
      from: parsed.data.from ? new Date(parsed.data.from) : undefined,
      to: parsed.data.to ? new Date(parsed.data.to) : undefined,
      minAmount: parsed.data.minAmount,
      limit: parsed.data.limit ?? 50,
    });

    return NextResponse.json({ events, count: events.length });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
