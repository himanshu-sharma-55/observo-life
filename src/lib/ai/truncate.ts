import { EVENT_TEXT_MAX_CHARS } from "@/lib/ai/constants";

export function truncateEventText(text: string, max = EVENT_TEXT_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
