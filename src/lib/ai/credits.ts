import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/db/models";
import { isEmailAiUnlimited } from "@/lib/ai/access";
import { FREE_AI_CREDITS } from "@/lib/ai/constants";

export class AiCreditsError extends Error {
  constructor(
    message = "You’re out of free AI credits. Email to buy more and keep generating insights.",
  ) {
    super(message);
    this.name = "AiCreditsError";
  }
}

export type AiCreditStatus = {
  unlimited: boolean;
  credits: number;
  freeTrialCredits: number;
};

const PURCHASE_EMAIL =
  process.env.NEXT_PUBLIC_AI_CREDITS_EMAIL?.trim() || "himanshussharma36@gmail.com";

export function getAiCreditsPurchaseEmail() {
  return PURCHASE_EMAIL;
}

export function buildBuyCreditsMailto(accountEmail?: string | null) {
  const subject = encodeURIComponent("Observolife: buy AI credits");
  const body = encodeURIComponent(
    [
      "Hi Himanshu,",
      "",
      "I'd like to buy more AI credits for Observolife.",
      "",
      `Account email: ${accountEmail?.trim() || "(please fill in)"}`,
      "Credits wanted: (e.g. 10)",
      "",
      "Thanks",
    ].join("\n"),
  );

  return `mailto:${PURCHASE_EMAIL}?subject=${subject}&body=${body}`;
}

async function ensureCreditsInitialized(userId: string) {
  await User.updateOne(
    {
      _id: userId,
      $or: [{ aiCredits: { $exists: false } }, { aiCredits: null }],
    },
    { $set: { aiCredits: FREE_AI_CREDITS } },
  );
}

export async function getAiCreditStatus(
  userId: string,
  email: string | null | undefined,
): Promise<AiCreditStatus> {
  if (isEmailAiUnlimited(email)) {
    return { unlimited: true, credits: Number.POSITIVE_INFINITY, freeTrialCredits: FREE_AI_CREDITS };
  }

  await connectToDatabase();
  await ensureCreditsInitialized(userId);

  const user = await User.findById(userId).select("aiCredits").lean();
  const credits =
    typeof user?.aiCredits === "number" && Number.isFinite(user.aiCredits)
      ? Math.max(0, Math.floor(user.aiCredits))
      : FREE_AI_CREDITS;

  return { unlimited: false, credits, freeTrialCredits: FREE_AI_CREDITS };
}

export async function assertAiCreditAvailable(
  userId: string,
  email: string | null | undefined,
) {
  const status = await getAiCreditStatus(userId, email);
  if (status.unlimited) return status;
  if (status.credits <= 0) {
    throw new AiCreditsError();
  }
  return status;
}

/**
 * Atomically reserve one credit before an AI call.
 * Call refundAiCredit if generation fails after a successful reserve.
 */
export async function reserveAiCredit(
  userId: string,
  email: string | null | undefined,
): Promise<{ unlimited: boolean; credits: number; reserved: boolean }> {
  if (isEmailAiUnlimited(email)) {
    return { unlimited: true, credits: Number.POSITIVE_INFINITY, reserved: false };
  }

  await connectToDatabase();
  await ensureCreditsInitialized(userId);

  const updated = await User.findOneAndUpdate(
    { _id: userId, aiCredits: { $gt: 0 } },
    { $inc: { aiCredits: -1 } },
    { new: true },
  )
    .select("aiCredits")
    .lean();

  if (!updated) {
    throw new AiCreditsError();
  }

  const credits =
    typeof updated.aiCredits === "number" ? Math.max(0, Math.floor(updated.aiCredits)) : 0;

  return { unlimited: false, credits, reserved: true };
}

export async function refundAiCredit(
  userId: string,
  email: string | null | undefined,
  reserved: boolean,
) {
  if (!reserved || isEmailAiUnlimited(email)) return;

  await connectToDatabase();
  await User.updateOne({ _id: userId }, { $inc: { aiCredits: 1 } });
}

/** Deduct one credit only after a successful AI run. No-op for unlimited accounts. */
export async function consumeAiCreditOnSuccess(
  userId: string,
  email: string | null | undefined,
): Promise<AiCreditStatus> {
  if (isEmailAiUnlimited(email)) {
    return getAiCreditStatus(userId, email);
  }

  await connectToDatabase();
  await ensureCreditsInitialized(userId);

  const updated = await User.findOneAndUpdate(
    { _id: userId, aiCredits: { $gt: 0 } },
    { $inc: { aiCredits: -1 } },
    { new: true },
  )
    .select("aiCredits")
    .lean();

  const credits =
    typeof updated?.aiCredits === "number" ? Math.max(0, Math.floor(updated.aiCredits)) : 0;

  return { unlimited: false, credits, freeTrialCredits: FREE_AI_CREDITS };
}
