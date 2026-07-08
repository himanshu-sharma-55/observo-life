/** Plain-text fallback for storage, search, and legacy clients. */
export type InsightTextFields = {
  title: string;
  body: string;
  takeaway?: string | null;
};

export function formatInsightPlainText(insight: InsightTextFields): string {
  return [insight.title.trim(), insight.body.trim(), insight.takeaway?.trim()]
    .filter(Boolean)
    .join("\n\n");
}

export function insightForPrompt(insight: {
  title?: string;
  body?: string;
  takeaway?: string | null;
  content: string;
}) {
  if (insight.title && insight.body) {
    return {
      title: insight.title,
      body: insight.body,
      takeaway: insight.takeaway ?? undefined,
    };
  }

  return { summary: insight.content };
}

export type EvidenceEvent = {
  id: string;
  rawText: string;
  occurredAt: string;
  tags?: string[];
};

export function splitInsightBody(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
