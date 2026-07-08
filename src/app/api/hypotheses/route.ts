import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { createHypothesis, listHypotheses } from "@/lib/hypotheses/service";

const createSchema = z.object({
  statement: z.string().min(1).max(500),
  keywords: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const items = await listHypotheses(userId);
    return NextResponse.json({ hypotheses: items });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch hypotheses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid hypothesis data" }, { status: 400 });
    }

    const hypothesis = await createHypothesis(userId, parsed.data);
    return NextResponse.json({ hypothesis }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to create hypothesis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
