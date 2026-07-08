import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db/serialize";
import { listEventTags } from "@/lib/events/service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const tags = await listEventTags(userId, q, limit);

    return NextResponse.json({ tags });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[api/events/tags GET]", error);
    return NextResponse.json(
      { error: dbErrorMessage(error, "Failed to fetch tags") },
      { status: 500 },
    );
  }
}
