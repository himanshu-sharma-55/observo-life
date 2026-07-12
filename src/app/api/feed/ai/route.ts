import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAiUserId } from "@/lib/ai/access";
import { isAiConfigured } from "@/lib/ai/client";
import { aiRouteErrorResponse } from "@/lib/ai/route-errors";
import { AiFeedOptionsSchema, DEFAULT_AI_FEED_OPTIONS } from "@/lib/feed/ai-options";
import { generateAiFeed } from "@/lib/feed/generate-ai";

export async function POST(request: Request) {
  try {
    const userId = await requireAiUserId();

    if (!isAiConfigured()) {
      return NextResponse.json(
        { error: "AI is not configured yet. Add a GEMINI_API_KEY to enable insights." },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = AiFeedOptionsSchema.safeParse(
      typeof body === "object" && body && "options" in body
        ? body.options
        : DEFAULT_AI_FEED_OPTIONS,
    );
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid insight options.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await generateAiFeed(userId, parsed.data);

    if (result.reason === "no_data") {
      return NextResponse.json(
        { error: "No matching data for the options you selected. Log events or try other choices." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      currentInserted: result.currentInserted,
      overallInserted: result.overallInserted,
      inserted: result.currentInserted + result.overallInserted,
      runId: result.runId,
      sequence: result.sequence,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    const aiError = aiRouteErrorResponse(error);
    if (aiError) return aiError;
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "AI returned an invalid response format.";
      console.error("[api/feed/ai] validation failed", error.issues);
      return NextResponse.json({ error: message }, { status: 502 });
    }
    const message =
      error instanceof Error ? error.message : "Failed to generate AI insights.";
    console.error("[api/feed/ai]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
