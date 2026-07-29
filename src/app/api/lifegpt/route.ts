import { NextResponse } from "next/server";
import { requireAiUser } from "@/lib/ai/access";
import { isAiConfigured } from "@/lib/ai/client";
import { refundAiCredit, reserveAiCredit } from "@/lib/ai/credits";
import { aiRouteErrorResponse } from "@/lib/ai/route-errors";
import {
  generateLifeGptAnswer,
  LifeGptRequestSchema,
} from "@/lib/lifegpt/generate";

export async function POST(request: Request) {
  let reserved = false;
  let userId: string | null = null;
  let email: string | null = null;

  try {
    const session = await requireAiUser();
    userId = session.userId;
    email = session.email;

    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured yet. Add a GEMINI_API_KEY to enable LifeGPT." },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = LifeGptRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid chat request.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const reservation = await reserveAiCredit(userId, email);
    reserved = reservation.reserved;

    const result = await generateLifeGptAnswer(
      userId,
      parsed.data.message,
      parsed.data.history ?? [],
    );

    return NextResponse.json({
      answer: result.answer,
      suggestion: result.suggestion,
      evidence: result.evidence,
      eventCount: result.eventCount,
      credits: {
        unlimited: reservation.unlimited,
        remaining: reservation.unlimited ? null : reservation.credits,
      },
    });
  } catch (error) {
    if (reserved && userId) {
      await refundAiCredit(userId, email, true).catch(() => undefined);
    }
    if (error instanceof Response) return error;
    const aiError = aiRouteErrorResponse(error);
    if (aiError) return aiError;
    const message = error instanceof Error ? error.message : "LifeGPT failed.";
    console.error("[api/lifegpt]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
