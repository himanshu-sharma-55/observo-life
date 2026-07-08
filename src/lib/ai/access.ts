import { auth } from "@/lib/auth";

export class AiAccessError extends Error {
  constructor(message = "AI features are not available for this account.") {
    super(message);
    this.name = "AiAccessError";
  }
}

function parseAllowedEmails(): string[] {
  const raw = process.env.AI_ALLOWED_EMAILS;
  if (!raw?.trim()) return [];

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAiAllowlistEnabled() {
  return parseAllowedEmails().length > 0;
}

export function isEmailAiAllowed(email: string | null | undefined) {
  const allowed = parseAllowedEmails();
  if (allowed.length === 0) return true;

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;

  return allowed.includes(normalized);
}

export function isAiEnabledForUser(email: string | null | undefined, configured: boolean) {
  return configured && isEmailAiAllowed(email);
}

export async function requireAiUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isEmailAiAllowed(session.user.email)) {
    throw new Response(JSON.stringify({ error: new AiAccessError().message }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session.user.id;
}

export async function assertAiAccess(email: string | null | undefined) {
  if (!isEmailAiAllowed(email)) {
    throw new AiAccessError();
  }
}
