import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { isEmailAiAllowed } from "@/lib/ai/access";

export async function GET() {
  const session = await auth();
  const configured = isAiConfigured();
  const allowed = isEmailAiAllowed(session?.user?.email);

  return NextResponse.json({
    configured,
    allowed,
    enabled: configured && allowed,
  });
}
