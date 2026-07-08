import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { isEmailAiAllowed } from "@/lib/ai/access";
import { requireUserId } from "@/lib/auth/session";
import { getEligibleRecapMonth } from "@/lib/feed/generate-recap";

export async function GET() {
  try {
    const userId = await requireUserId();
    const session = await auth();

    if (!isAiConfigured() || !isEmailAiAllowed(session?.user?.email)) {
      return NextResponse.json({ eligible: null });
    }

    const eligible = await getEligibleRecapMonth(userId);
    return NextResponse.json({ eligible });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to check recap eligibility" }, { status: 500 });
  }
}
