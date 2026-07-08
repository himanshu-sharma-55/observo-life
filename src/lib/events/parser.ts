const MONEY_PATTERNS = [
  /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /\$\s*([\d,]+(?:\.\d{1,2})?)/,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr)/i,
];

export { extractSignals } from "@/lib/aggregates/signals";

export function parseMoneyFromText(
  text: string,
  defaultCurrency = "INR",
): { amount: string | null; currency: string | null } {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const normalized = match[1].replace(/,/g, "");
      const currency = pattern.source.includes("$") ? "USD" : defaultCurrency;
      return { amount: normalized, currency };
    }
  }

  return { amount: null, currency: null };
}

export function parseBulkEvents(rawText: string): string[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter((line) => line.trim().length > 0);
}
