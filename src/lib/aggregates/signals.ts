export const SIGNAL_MAP: Record<string, string[]> = {
  coffee: ["coffee", "espresso", "caffeine", "latte", "cappuccino"],
  sleep: ["sleep", "insomnia", "slept", "nap", "tired", "couldn't sleep", "slept late"],
  gym: ["gym", "workout", "exercise", "run", "walk", "yoga", "training"],
  food: ["ate", "lunch", "dinner", "breakfast", "biryani", "food", "tiramisu", "dessert"],
  work: ["work", "meeting", "startup", "office", "project", "deadline"],
  stress: ["stress", "stressful", "anxious", "anxiety", "fight", "overwhelmed"],
  social: ["friends", "dinner with", "party", "family", "hangout"],
  mood: ["happy", "great", "sad", "low", "energized", "feeling good", "feeling anxious"],
  reading: ["read", "book", "article", "chapter"],
  spending: ["bought", "ordered", "paid", "purchase", "restaurant"],
};

export function extractSignals(text: string): string[] {
  const normalized = text.toLowerCase();

  return Object.entries(SIGNAL_MAP)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([signal]) => signal);
}

export function normalizeEvent(rawText: string) {
  return {
    rawText: rawText.trim(),
    signals: extractSignals(rawText),
    normalizedText: rawText.trim().toLowerCase(),
  };
}

export function formatSignalLabel(signal: string) {
  return signal.charAt(0).toUpperCase() + signal.slice(1);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
