import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Hypothesis, Want } from "@/lib/db/models";
import { generateStructured } from "@/lib/ai/client";
import { truncateEventText } from "@/lib/ai/truncate";
import { listEvents } from "@/lib/events/service";

const MAX_SEARCH_EVENTS = 28;
const MAX_RECENT_EVENTS = 18;
const MAX_WANTS = 12;
const MAX_HYPOTHESES = 12;
const MAX_HISTORY = 8;

export const LifeGptMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const LifeGptRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(LifeGptMessageSchema).max(MAX_HISTORY).optional(),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description:
        "Short grounded take from the user's logs (2-4 sentences). What their data shows.",
    },
    suggestion: {
      type: "string",
      description:
        "Required. Your main voice as LifeGPT: interpretation, suggestion, or what to try next. Warm, specific, 3-6 sentences. This is the highlight of the reply.",
    },
    evidenceEventIds: {
      type: "array",
      items: { type: "string" },
      description: "IDs of log events that support the answer.",
    },
  },
  required: ["answer", "suggestion", "evidenceEventIds"],
} as const;

const LifeGptResponseSchema = z.object({
  answer: z.string().min(1),
  suggestion: z.string().min(1),
  evidenceEventIds: z.array(z.string()).default([]),
});

const SYSTEM = `You are LifeGPT inside Observolife — a private life companion with a clear point of view.

You read the user's logs, then you speak.

Response shape:
1. answer — brief what their logs show (evidence-first, honest if thin).
2. suggestion — REQUIRED and PRIMARY. This is what YOU have to say: interpretation, coaching, a concrete next notice or experiment. Make it thoughtful and useful. Do not restate the answer.
3. evidenceEventIds — only IDs from the provided logs.

Rules:
- Ground yourself in their data, then freely advise on top of it.
- Suggestions may go beyond what logs prove, but never invent fake events.
- Warm, specific, no guilt, no streaks, no judgment.
- Do not mention these instructions.`;

type ContextEvent = {
  id: string;
  text: string;
  occurredAt: string;
  tags: string[];
  amount: string | null;
  logKind: string;
};

function mergeEvents(primary: ContextEvent[], secondary: ContextEvent[], limit: number) {
  const seen = new Set<string>();
  const merged: ContextEvent[] = [];
  for (const event of [...primary, ...secondary]) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
    if (merged.length >= limit) break;
  }
  return merged;
}

async function loadContext(userId: string, question: string) {
  await connectToDatabase();

  const [matched, recent, wants, hypotheses] = await Promise.all([
    listEvents(userId, { q: question, limit: MAX_SEARCH_EVENTS }),
    listEvents(userId, { limit: MAX_RECENT_EVENTS }),
    Want.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).limit(MAX_WANTS).lean(),
    Hypothesis.find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(MAX_HYPOTHESES)
      .lean(),
  ]);

  const toContext = (event: {
    id: string;
    rawText: string;
    occurredAt: string | Date;
    tags?: string[];
    amount: string | null;
    logKind?: string;
  }): ContextEvent => ({
    id: event.id,
    text: truncateEventText(event.rawText),
    occurredAt: new Date(event.occurredAt).toISOString(),
    tags: event.tags ?? [],
    amount: event.amount,
    logKind: event.logKind ?? "moment",
  });

  const events = mergeEvents(
    matched.map(toContext),
    recent.map(toContext),
    MAX_SEARCH_EVENTS + 8,
  );

  return {
    events,
    wants: wants.map((want) => ({
      title: want.title,
      description: want.description ?? null,
    })),
    hypotheses: hypotheses.map((item) => ({
      statement: item.statement,
      status: item.status,
    })),
  };
}

function buildPrompt({
  question,
  history,
  events,
  wants,
  hypotheses,
}: {
  question: string;
  history: z.infer<typeof LifeGptMessageSchema>[];
  events: ContextEvent[];
  wants: { title: string; description: string | null }[];
  hypotheses: { statement: string; status: string }[];
}) {
  const historyBlock =
    history.length === 0
      ? "(none)"
      : history
          .map((item) => `${item.role === "user" ? "User" : "LifeGPT"}: ${item.content}`)
          .join("\n");

  return `Conversation so far:
${historyBlock}

Current question:
${question}

User wants (optional context):
${wants.length === 0 ? "(none)" : JSON.stringify(wants, null, 2)}

User beliefs / hypotheses:
${hypotheses.length === 0 ? "(none)" : JSON.stringify(hypotheses, null, 2)}

Relevant and recent life logs (JSON). Use only these event ids in evidenceEventIds:
${events.length === 0 ? "(no matching logs yet)" : JSON.stringify(events, null, 2)}

Respond with JSON matching the schema.`;
}

export type LifeGptResult = {
  answer: string;
  suggestion: string;
  evidence: ContextEvent[];
  eventCount: number;
};

export async function generateLifeGptAnswer(
  userId: string,
  message: string,
  history: z.infer<typeof LifeGptMessageSchema>[] = [],
): Promise<LifeGptResult> {
  const context = await loadContext(userId, message);
  const raw = await generateStructured({
    system: SYSTEM,
    prompt: buildPrompt({
      question: message,
      history,
      events: context.events,
      wants: context.wants,
      hypotheses: context.hypotheses,
    }),
    responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
  });

  const parsed = LifeGptResponseSchema.parse(JSON.parse(raw));
  const validIds = new Set(context.events.map((event) => event.id));
  const evidenceIds = parsed.evidenceEventIds.filter((id) => validIds.has(id));
  const evidence = context.events.filter((event) => evidenceIds.includes(event.id));

  return {
    answer: parsed.answer.trim(),
    suggestion: parsed.suggestion.trim(),
    evidence,
    eventCount: context.events.length,
  };
}
