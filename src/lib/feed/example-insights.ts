import type { EvidenceEvent } from "@/lib/feed/insight-format";

export type ExampleFeedInsight = {
  type: string;
  title: string;
  body: string;
  takeaway?: string;
  sampleEvents: EvidenceEvent[];
};

export const currentExampleInsights: ExampleFeedInsight[] = [
  {
    type: "change_detected",
    title: "A quieter week showed up in your logs",
    body:
      "You logged noticeably less than last week — the softest stretch in about a month.\n\nThat kind of pause often happens when life gets full elsewhere. It doesn't erase momentum; it just shifts where your attention went.",
    takeaway: "One small habit picked back up could restart the rhythm.",
    sampleEvents: [
      {
        id: "ex-1",
        rawText: "Skipped gym — long work day",
        occurredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: "ex-2",
        rawText: "No log yesterday, back today",
        occurredAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  },
  {
    type: "interesting",
    title: "Morning runs are becoming a pattern",
    body:
      "Runs appeared three times this week, up from once the week before. They're landing on different days, which suggests flexibility rather than a rigid streak.",
    takeaway: "Worth noticing if this is the routine you want to keep building.",
    sampleEvents: [
      {
        id: "ex-3",
        rawText: "Morning run 5k before breakfast",
        occurredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "ex-4",
        rawText: "Easy jog in the park",
        occurredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
  },
];

export const overallExampleInsights: ExampleFeedInsight[] = [
  {
    type: "pattern",
    title: "Weekend dinners have their own rhythm",
    body:
      "Every other Saturday, dining logs show up like clockwork — six weeks in a row without you forcing it.\n\nThat's less about spending and more about a ritual you've quietly kept.",
    takeaway: "A pattern worth protecting if it brings you something good.",
    sampleEvents: [
      {
        id: "ex-5",
        rawText: "Dinner at Olive Bar — ₹1,800",
        occurredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: "ex-6",
        rawText: "Saturday night out with friends",
        occurredAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ],
  },
  {
    type: "timeline",
    title: "Sleep notes dipped, then returned",
    body:
      "Sleep logging went quiet for two weeks mid-month, then came back this week. Gaps like that are easy to miss when you're living inside the week.\n\nThe return matters: the habit didn't disappear — it paused.",
    takeaway: "If sleep still matters to you, this is a gentle moment to recommit.",
    sampleEvents: [
      {
        id: "ex-7",
        rawText: "Slept 7h — felt rested",
        occurredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ],
  },
];

export function getExampleInsightsForScope(scope: "current" | "overall") {
  return scope === "current" ? currentExampleInsights : overallExampleInsights;
}
