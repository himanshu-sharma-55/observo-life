import { NextResponse } from "next/server";
import { isAiConfigured } from "@/lib/ai/client";
import { requireUserId } from "@/lib/auth/session";
import { getEligibleRecapMonth } from "@/lib/feed/generate-recap";

export async function GET() {
  try {
    const userId = await requireUserId();

    if (!isAiConfigured()) {
      return NextResponse.json({ eligible: null });
    }

    const eligible = await getEligibleRecapMonth(userId);
    return NextResponse.json({ eligible });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to check recap eligibility" }, { status: 500 });
  }
}
