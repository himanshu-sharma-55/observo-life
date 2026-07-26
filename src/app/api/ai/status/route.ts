import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import {
  buildBuyCreditsMailto,
  getAiCreditStatus,
  getAiCreditsPurchaseEmail,
} from "@/lib/ai/credits";

export async function GET() {
  const session = await auth();
  const configured = isAiConfigured();

  if (!session?.user?.id) {
    return NextResponse.json({
      configured,
      enabled: false,
      unlimited: false,
      credits: 0,
      purchaseEmail: getAiCreditsPurchaseEmail(),
      buyCreditsMailto: buildBuyCreditsMailto(null),
    });
  }

  if (!configured) {
    return NextResponse.json({
      configured: false,
      enabled: false,
      unlimited: false,
      credits: 0,
      purchaseEmail: getAiCreditsPurchaseEmail(),
      buyCreditsMailto: buildBuyCreditsMailto(session.user.email),
    });
  }

  const status = await getAiCreditStatus(session.user.id, session.user.email);

  return NextResponse.json({
    configured: true,
    enabled: true,
    unlimited: status.unlimited,
    credits: status.unlimited ? null : status.credits,
    freeTrialCredits: status.freeTrialCredits,
    purchaseEmail: getAiCreditsPurchaseEmail(),
    buyCreditsMailto: buildBuyCreditsMailto(session.user.email),
  });
}
