import type { WeekRollup } from "@/lib/aggregates/pipeline";
import type { RecapInsight } from "@/lib/db/models";
import type { FeedPromptContext } from "@/lib/feed/ai-options";
import { INSIGHT_OUTPUT_RULES, INSIGHT_VOICE_RULES } from "@/lib/feed/prompts/voice";
import { insightForPrompt } from "@/lib/feed/insight-format";

export const OVERALL_SYSTEM = `You are a perceptive personal-analytics assistant for a life-logging app.
You produce OVERALL multi-week insights — the deeper rhythms, arcs, and through-lines in someone's life.

${INSIGHT_VOICE_RULES}

Scope rules:
- Base every statement ONLY on the provided data.
- Focus on cross-week patterns, recurring rituals, slow drifts, comebacks after gaps, spending rhythms.
- Do NOT restate this-week-only deltas (that is the Current feed's job).
- Do not repeat priorOverallInsights or compactInsights verbatim unless something materially changed.
- Cite evidenceEventIds only when present in the data.
- When wants are provided, show how weeks of behavior align with or drift from what they said they want — with curiosity, not scorekeeping.
- When beliefs are provided, surface patterns that quietly support or complicate those beliefs over time.

${INSIGHT_OUTPUT_RULES}

Return insights with types: pattern, timeline, observation.
Favor cards that reveal a rhythm the user might be proud of, or a gap that invites a conscious choice.`;

export function buildOverallPrompt(input: {
  rollups: WeekRollup[];
  hotInsights: RecapInsight[];
  warmCompact: RecapInsight[];
  context?: FeedPromptContext;
}) {
  const payload: Record<string, unknown> = {
    windowWeeks: input.rollups.length,
    weeklyRollups: input.rollups,
    priorOverallInsights: input.hotInsights.map((insight) => insightForPrompt(insight)),
    monthlyCompactInsights: input.warmCompact.map((insight) => insightForPrompt(insight)),
  };

  if (input.context?.wants?.length) payload.wants = input.context.wants;
  if (input.context?.beliefs?.length) payload.beliefs = input.context.beliefs;

  return `Produce OVERALL multi-week insights that feel like discovering your own patterns.\n\n${JSON.stringify(payload)}`;
}
