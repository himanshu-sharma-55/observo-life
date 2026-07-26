import { auth } from "@/lib/auth";

export class AiAccessError extends Error {
  constructor(message = "AI features are not available for this account.") {
    super(message);
    this.name = "AiAccessError";
  }
}

/** Emails in AI_ALLOWED_EMAILS get unlimited AI credits (owner / staff). */
function parseUnlimitedEmails(): string[] {
  const raw = process.env.AI_ALLOWED_EMAILS;
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAiUnlimited(email: string | null | undefined) {
  const unlimited = parseUnlimitedEmails();
  if (unlimited.length === 0) return false;

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  return unlimited.includes(normalized);
}

/** @deprecated Use isEmailAiUnlimited — kept for older call sites during migration. */
export function isEmailAiAllowed(_email: string | null | undefined) {
  return true;
}

export function isAiEnabledForUser(_email: string | null | undefined, configured: boolean) {
  return configured;
}

export async function requireAiUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? null,
  };
}

/** @deprecated Prefer requireAiUser() for credit-aware routes. */
export async function requireAiUserId() {
  const { userId } = await requireAiUser();
  return userId;
}

export async function assertAiAccess(_email: string | null | undefined) {
  // AI is available to any signed-in user when GEMINI is configured.
  // Credits are enforced separately.
}
