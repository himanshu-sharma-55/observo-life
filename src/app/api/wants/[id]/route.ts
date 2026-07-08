import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { deleteWant, updateWant } from "@/lib/wants/service";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
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
      return NextResponse.json({ error: "Invalid want data" }, { status: 400 });
    }

    const want = await updateWant(userId, id, parsed.data);
    if (!want) {
      return NextResponse.json({ error: "Want not found" }, { status: 404 });
    }

    return NextResponse.json({ want });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to update want" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const want = await deleteWant(userId, id);

    if (!want) {
      return NextResponse.json({ error: "Want not found" }, { status: 404 });
    }

    return NextResponse.json({ want });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to delete want" }, { status: 500 });
  }
}
