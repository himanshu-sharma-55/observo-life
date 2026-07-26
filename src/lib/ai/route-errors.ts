import { AiAccessError } from "@/lib/ai/access";
import { AiCreditsError } from "@/lib/ai/credits";
import { AiLockError, AiRateLimitError } from "@/lib/ai/guards";

export function aiRouteErrorResponse(error: unknown) {
  if (error instanceof AiRateLimitError) {
    return Response.json({ error: error.message, code: "rate_limit" }, { status: 429 });
  }
  if (error instanceof AiLockError) {
    return Response.json({ error: error.message, code: "ai_lock" }, { status: 409 });
  }
  if (error instanceof AiCreditsError) {
    return Response.json({ error: error.message, code: "ai_credits" }, { status: 402 });
  }
  if (error instanceof AiAccessError) {
    return Response.json({ error: error.message, code: "ai_access" }, { status: 403 });
  }
  return null;
}
