import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { createWant, listWants } from "@/lib/wants/service";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  keywords: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const items = await listWants(userId);
    return NextResponse.json({ wants: items });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch wants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid want data" }, { status: 400 });
    }

    const want = await createWant(userId, parsed.data);
    return NextResponse.json({ want }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to create want";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
