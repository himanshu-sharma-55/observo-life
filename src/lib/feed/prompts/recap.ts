import type { MonthRecapStats } from "@/lib/db/models";
import type { RecapInsight } from "@/lib/db/models";
import { INSIGHT_VOICE_RULES } from "@/lib/feed/prompts/voice";
import { insightForPrompt } from "@/lib/feed/insight-format";

export const RECAP_SYSTEM = `You are a perceptive personal-analytics assistant writing a monthly life recap.
You receive stats, sample events, wants, beliefs, and prior insights.

${INSIGHT_VOICE_RULES}

Recap structure:
- headline: evocative, specific to this month — character and arc, not a generic motivational line.
- sections: 4-6 story cards mixing stat highlights and human observations; each card should feel worth reading.
- surpriseInsights: up to 3 structured cards (title, body, takeaway) — cross-signal connections, wants alignment, belief touches; make these the "wow" moments.
- compactInsights: 3–5 structured monthly patterns for long-term memory; multi-paragraph, honest but forward-leaning.
- Do NOT repeat Overall feed observations verbatim — find fresh story angles.
- Only cite evidenceEventIds from the provided events list.
- Entries with logKind "day" are whole-day summaries — weave them with moment events from the same date.
- No medical/financial advice.`;

export function buildRecapPrompt(input: {
  month: string;
  monthLabel: string;
  stats: MonthRecapStats;
  events: { id: string; text: string; occurredAt: string }[];
  wants: { title: string; description?: string | null }[];
  hypotheses: { statement: string }[];
  priorOverallInsights: RecapInsight[];
  latestOverallFeed: RecapInsight[];
}) {
  return `Write the month recap for ${input.monthLabel} (${input.month}) — interesting, honest, and gently forward-looking.\n\n${JSON.stringify({
    stats: input.stats,
    sampleEvents: input.events,
    wants: input.wants,
    hypotheses: input.hypotheses,
    priorOverallInsights: input.priorOverallInsights.map((insight) => insightForPrompt(insight)),
    latestOverallFeed: input.latestOverallFeed.map((insight) => insightForPrompt(insight)),
  })}`;
}
