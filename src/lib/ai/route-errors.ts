import { AiAccessError } from "@/lib/ai/access";
import { AiLockError, AiRateLimitError } from "@/lib/ai/guards";

export function aiRouteErrorResponse(error: unknown) {
  if (error instanceof AiRateLimitError) {
    return Response.json({ error: error.message }, { status: 429 });
  }
  if (error instanceof AiLockError) {
    return Response.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof AiAccessError) {
    return Response.json({ error: error.message }, { status: 403 });
  }
  return null;
}
