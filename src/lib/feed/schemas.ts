import { z } from "zod";
import { getGeminiModel } from "@/lib/ai/constants";
import { formatInsightPlainText } from "@/lib/feed/insight-format";

export const FEED_TYPES = [
  "observation",
  "interesting",
  "change_detected",
  "pattern",
  "timeline",
] as const;

export type FeedType = (typeof FEED_TYPES)[number];

const FEED_TYPE_SET = new Set<string>(FEED_TYPES);

/** Gemini sometimes invents types; map unknown values to a safe default. */
export function coerceInsightType(value: unknown): FeedType {
  if (typeof value === "string" && FEED_TYPE_SET.has(value)) {
    return value as FeedType;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("pattern")) return "pattern";
    if (normalized.includes("change") || normalized.includes("shift")) {
      return "change_detected";
    }
    if (normalized.includes("timeline") || normalized.includes("history")) {
      return "timeline";
    }
    if (normalized.includes("interesting") || normalized.includes("surprise")) {
      return "interesting";
    }
  }

  return "observation";
}

export const InsightSchema = z.object({
  type: z.preprocess(coerceInsightType, z.enum(FEED_TYPES)),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(900),
  takeaway: z.string().max(180).optional(),
  evidenceEventIds: z.array(z.string()).default([]),
});

export const MAX_FEED_INSIGHTS = 10;

export const InsightsSchema = z.object({
  insights: z.array(InsightSchema).min(1).max(MAX_FEED_INSIGHTS),
});

export function parseInsightsJson(raw: string) {
  const parsed = InsightsSchema.safeParse(JSON.parse(raw));
  if (parsed.success) return parsed.data;

  const issue = parsed.error.issues[0];
  throw new Error(
    issue
      ? `AI returned an invalid insight format (${issue.path.join(".") || "insights"}: ${issue.message}).`
      : "AI returned an invalid insight format.",
  );
}

export type Insight = z.infer<typeof InsightSchema>;

export type StoredInsight = Insight & { content: string };

export const INSIGHTS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    insights: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: [...FEED_TYPES] },
          title: { type: "STRING" },
          body: { type: "STRING" },
          takeaway: { type: "STRING" },
          evidenceEventIds: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["type", "title", "body"],
      },
    },
  },
  required: ["insights"],
};

export const RecapSectionSchema = z.object({
  id: z.string(),
  kind: z.enum(["stat", "highlight", "surprise", "pattern"]),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  stat: z.object({ label: z.string(), value: z.string() }).optional(),
  evidenceEventIds: z.array(z.string()).optional(),
});

export const RecapResponseSchema = z.object({
  headline: z.string().min(1).max(160),
  sections: z.array(RecapSectionSchema).min(2).max(8),
  surpriseInsights: z.array(InsightSchema).max(3),
  compactInsights: z.array(InsightSchema).max(6),
});

export const RECAP_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          kind: { type: "STRING", enum: ["stat", "highlight", "surprise", "pattern"] },
          title: { type: "STRING" },
          body: { type: "STRING" },
          stat: {
            type: "OBJECT",
            properties: { label: { type: "STRING" }, value: { type: "STRING" } },
          },
          evidenceEventIds: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["id", "kind", "title", "body"],
      },
    },
    surpriseInsights: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: [...FEED_TYPES] },
          title: { type: "STRING" },
          body: { type: "STRING" },
          takeaway: { type: "STRING" },
          evidenceEventIds: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["type", "title", "body"],
      },
    },
    compactInsights: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING", enum: [...FEED_TYPES] },
          title: { type: "STRING" },
          body: { type: "STRING" },
          takeaway: { type: "STRING" },
          evidenceEventIds: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["type", "title", "body"],
      },
    },
  },
  required: ["headline", "sections", "surpriseInsights", "compactInsights"],
};

export const GEMINI_MODEL = getGeminiModel();

export function filterEvidence(
  insights: Insight[],
  validIds: Set<string>,
): StoredInsight[] {
  return insights.map((insight) => {
    const title = insight.title.trim();
    const body = insight.body.trim();
    const takeaway = insight.takeaway?.trim() || undefined;

    return {
      type: insight.type,
      title,
      body,
      takeaway,
      content: formatInsightPlainText({ title, body, takeaway }),
      evidenceEventIds: insight.evidenceEventIds.filter((id) => validIds.has(id)),
    };
  });
}
