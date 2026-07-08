import type { PeriodAggregates } from "@/lib/aggregates/pipeline";
import type { RecapInsight } from "@/lib/db/models";
import type { FeedPromptContext } from "@/lib/feed/ai-options";
import { truncateEventText } from "@/lib/ai/truncate";
import { CURRENT_PROMPT_MAX_EVENTS } from "@/lib/ai/constants";
import { INSIGHT_OUTPUT_RULES, INSIGHT_VOICE_RULES } from "@/lib/feed/prompts/voice";
import { insightForPrompt } from "@/lib/feed/insight-format";

export const CURRENT_SYSTEM = `You are a perceptive personal-analytics assistant for a life-logging app.
You produce CURRENT-WEEK insights — what is new, shifting, or worth attention right now.

${INSIGHT_VOICE_RULES}

Scope rules:
- Base every statement ONLY on the provided data.
- Focus on this week vs last week: deltas, comebacks, quiet stretches, new sparks.
- Do NOT state multi-month or long-term patterns (that is the Overall feed's job).
- Only cite evidenceEventIds from the provided events list.
- Entries with logKind "day" are whole-day summaries — read them alongside moment events from the same date.
- Do not repeat priorCurrentInsights verbatim.
- When wants are provided, highlight alignment or gentle tension — frame wants as direction, not judgment.
- When beliefs are provided, note whether this week's events support, challenge, or simply touch those beliefs.

${INSIGHT_OUTPUT_RULES}

Return insights with types: change_detected, observation, interesting.
Make at least one insight feel like a pleasant surprise or a useful reframe.`;

export function buildCurrentPrompt(
  aggregates: PeriodAggregates,
  priorInsights: RecapInsight[],
  context: FeedPromptContext = {},
) {
  const events = aggregates.currentEvents.slice(0, CURRENT_PROMPT_MAX_EVENTS).map((event) => ({
    id: event.id,
    text: truncateEventText(event.rawText),
    occurredAt: new Date(event.occurredAt).toISOString(),
    logKind: event.logKind,
    amount: event.amount ?? undefined,
  }));

  const payload: Record<string, unknown> = {
    periodDays: 7,
    totals: {
      thisWeek: aggregates.currentCount,
      lastWeek: aggregates.previousCount,
      today: aggregates.todayCount,
    },
    signals: aggregates.signalCounts,
    spending: aggregates.spending,
    dailyCounts: aggregates.dailyCounts,
    topTerms: aggregates.topTerms,
    events,
    priorCurrentInsights: priorInsights.map((insight) => insightForPrompt(insight)),
  };

  if (context.wants?.length) payload.wants = context.wants;
  if (context.beliefs?.length) payload.beliefs = context.beliefs;

  return `Produce CURRENT-WEEK insights that feel interesting and gently forward-looking.\n\n${JSON.stringify(payload)}`;
}
