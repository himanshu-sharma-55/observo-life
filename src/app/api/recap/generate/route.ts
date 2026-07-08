import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAiUserId } from "@/lib/ai/access";
import { isAiConfigured } from "@/lib/ai/client";
import { aiRouteErrorResponse } from "@/lib/ai/route-errors";
import { generateMonthRecap } from "@/lib/feed/generate-recap";

const bodySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const userId = await requireAiUserId();

    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured yet. Add a GEMINI_API_KEY to enable month insights." },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    const { recap, created } = await generateMonthRecap(userId, parsed.data.month);

    return NextResponse.json({
      recap,
      created,
      month: parsed.data.month,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    const aiError = aiRouteErrorResponse(error);
    if (aiError) return aiError;
    const message = error instanceof Error ? error.message : "Failed to generate month recap";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
