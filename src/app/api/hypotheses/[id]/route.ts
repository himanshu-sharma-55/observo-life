import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { deleteHypothesis, updateHypothesis } from "@/lib/hypotheses/service";

const updateSchema = z.object({
  statement: z.string().min(1).max(500).optional(),
  keywords: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid hypothesis data" }, { status: 400 });
    }

    const hypothesis = await updateHypothesis(userId, id, parsed.data);
    if (!hypothesis) {
      return NextResponse.json({ error: "Hypothesis not found" }, { status: 404 });
    }

    return NextResponse.json({ hypothesis });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to update hypothesis" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const hypothesis = await deleteHypothesis(userId, id);

    if (!hypothesis) {
      return NextResponse.json({ error: "Hypothesis not found" }, { status: 404 });
    }

    return NextResponse.json({ hypothesis });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to delete hypothesis" }, { status: 500 });
  }
}
