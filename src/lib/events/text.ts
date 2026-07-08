export function ensureNonemptyEventText(
  rawText: string,
  emptyMessage = "Event text is required",
): string {
  if (!rawText.trim()) {
    throw new Error(emptyMessage);
  }

  return rawText;
}
