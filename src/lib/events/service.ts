import type { PipelineStage } from "mongoose";
import { connectToDatabase, clientPromise, DB_NAME } from "@/lib/db";
import { documentId, toIsoString } from "@/lib/db/serialize";
import {
  AnalysisRun,
  Event,
  EventBatch,
  FeedItem,
  Hypothesis,
  MonthRecap,
  SavedActivity,
  UserSettings,
  Want,
} from "@/lib/db/models";
import { localDayAnchor, localDayEnd, localDayStart } from "@/lib/dates/day-bounds";
import { extractSignals, parseBulkEvents, parseMoneyFromText } from "@/lib/events/parser";
import { ensureNonemptyEventText } from "@/lib/events/text";
import type { EventLogKind } from "@/lib/events/log-kind";
import { normalizeTags } from "@/lib/events/tags";
import { searchEvents, type SearchOptions } from "@/lib/search/query";

type CreateEventInput = {
  rawText: string;
  occurredAt?: Date;
  logKind?: EventLogKind;
  logDay?: string;
  batchId?: string;
  currency?: string;
  tags?: string[];
};

export type SerializedEvent = {
  id: string;
  rawText: string;
  occurredAt: string;
  logKind: EventLogKind;
  tags: string[];
  amount: string | null;
  currency: string | null;
};

function serializeEvent(doc: {
  _id?: unknown;
  id?: string;
  rawText?: string;
  occurredAt?: Date | string;
  logKind?: EventLogKind | null;
  tags?: string[] | null;
  amount?: number | null;
  currency?: string | null;
}): SerializedEvent {
  return {
    id: documentId(doc),
    rawText: doc.rawText ?? "",
    occurredAt: toIsoString(doc.occurredAt),
    logKind: doc.logKind === "day" ? "day" : "moment",
    tags: normalizeTags(doc.tags),
    amount: doc.amount != null ? String(doc.amount) : null,
    currency: doc.currency ?? null,
  };
}

export function serializeEventForApi(
  doc: Parameters<typeof serializeEvent>[0],
): SerializedEvent {
  return serializeEvent(doc);
}

export async function createEvent(userId: string, input: CreateEventInput) {
  if (input.logKind === "day") {
    return upsertDayLog(userId, {
      rawText: input.rawText,
      logDay: input.logDay!,
      tags: input.tags,
    });
  }

  const event = await insertEvent(userId, input);
  return { event, updated: false };
}

async function insertEvent(userId: string, input: CreateEventInput) {
  const rawText = ensureNonemptyEventText(input.rawText);

  await connectToDatabase();

  const { amount, currency } = parseMoneyFromText(rawText, input.currency ?? "INR");
  const signals = extractSignals(rawText);

  const event = await Event.create({
    userId,
    batchId: input.batchId ?? null,
    rawText,
    occurredAt: input.occurredAt ?? new Date(),
    logKind: "moment",
    tags: normalizeTags(input.tags),
    amount: amount ? Number(amount) : null,
    currency: amount ? currency : null,
    parsed: { signals },
  });

  return event;
}

export async function upsertDayLog(
  userId: string,
  input: { rawText: string; logDay: string; tags?: string[] },
) {
  const rawText = ensureNonemptyEventText(input.rawText, "Day summary is required");

  await connectToDatabase();

  const dayStart = localDayStart(input.logDay);
  const dayEnd = localDayEnd(input.logDay);
  const signals = extractSignals(rawText);
  const tags = normalizeTags(input.tags);

  const existing = await Event.findOne({
    userId,
    logKind: "day",
    deletedAt: null,
    occurredAt: { $gte: dayStart, $lte: dayEnd },
  });

  if (existing) {
    existing.rawText = rawText;
    existing.tags = tags;
    existing.parsed = { signals };
    existing.amount = null;
    existing.currency = null;
    await existing.save();
    return { event: existing, updated: true };
  }

  const event = await Event.create({
    userId,
    batchId: null,
    rawText,
    occurredAt: localDayAnchor(input.logDay),
    logKind: "day",
    tags,
    amount: null,
    currency: null,
    parsed: { signals },
  });

  return { event, updated: false };
}

export async function createBulkEvents(
  userId: string,
  rawText: string,
  occurredAt?: Date,
  currency = "INR",
  tags?: string[],
) {
  const lines = parseBulkEvents(rawText);
  if (lines.length === 0) throw new Error("No events found in text");

  await connectToDatabase();

  const batch = await EventBatch.create({ userId, rawText });
  const normalizedTags = normalizeTags(tags);

  const created = [];
  for (const line of lines) {
    const event = await insertEvent(userId, {
      rawText: line,
      occurredAt,
      batchId: String(batch._id),
      currency,
      tags: normalizedTags,
    });
    created.push(event);
  }

  return { batch, events: created };
}

export async function listEvents(userId: string, options?: SearchOptions): Promise<SerializedEvent[]> {
  if (options?.q || options?.minAmount !== undefined || options?.tag) {
    const results = await searchEvents(userId, options);
    return results.map((doc) => serializeEvent(doc));
  }

  await connectToDatabase();

  const filter: Record<string, unknown> = { userId, deletedAt: null };

  if (options?.from || options?.to) {
    const occurredAt: Record<string, Date> = {};
    if (options.from) occurredAt.$gte = options.from;
    if (options.to) occurredAt.$lte = options.to;
    filter.occurredAt = occurredAt;
  }

  if (options?.tag) {
    const tag = normalizeTags([options.tag])[0];
    if (tag) filter.tags = tag;
  }

  const docs = await Event.find(filter)
    .sort({ occurredAt: options?.sort === "asc" ? 1 : -1 })
    .skip(options?.skip ?? 0)
    .limit(options?.limit ?? 100)
    .lean();

  return docs.map((doc) => serializeEvent(doc));
}

export async function listEventTags(userId: string, query?: string, limit = 20) {
  await connectToDatabase();

  const normalizedQuery = query ? normalizeTags([query])[0] : undefined;

  const pipeline: Record<string, unknown>[] = [
    {
      $match: {
        userId,
        deletedAt: null,
        tags: { $exists: true, $ne: [] },
      },
    },
    { $unwind: "$tags" },
  ];

  if (normalizedQuery) {
    pipeline.push({
      $match: {
        tags: {
          $regex: `^${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          $options: "i",
        },
      },
    });
  }

  pipeline.push(
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: limit },
  );

  const results = await Event.aggregate<{ _id: string }>(
    pipeline as unknown as PipelineStage[],
  );
  return normalizeTags(results.map((row) => String(row._id)));
}

type UpdateEventInput = {
  rawText?: string;
  occurredAt?: Date;
  currency?: string;
  tags?: string[];
};

export async function updateEvent(
  userId: string,
  eventId: string,
  input: UpdateEventInput,
) {
  const updates: Record<string, unknown> = {};

  if (input.rawText !== undefined) {
    const rawText = ensureNonemptyEventText(input.rawText);

    const { amount, currency } = parseMoneyFromText(rawText, input.currency ?? "INR");
    const signals = extractSignals(rawText);

    updates.rawText = rawText;
    updates.amount = amount ? Number(amount) : null;
    updates.currency = amount ? currency : null;
    updates.parsed = { signals };
  }

  if (input.occurredAt !== undefined) {
    updates.occurredAt = input.occurredAt;
  }

  if (input.tags !== undefined) {
    updates.tags = normalizeTags(input.tags);
  }

  if (Object.keys(updates).length === 0) return null;

  await connectToDatabase();

  const event = await Event.findOneAndUpdate(
    { _id: eventId, userId, deletedAt: null },
    { $set: updates },
    { new: true },
  );

  return event ?? null;
}

export async function softDeleteEvent(userId: string, eventId: string) {
  await connectToDatabase();

  const event = await Event.findOneAndUpdate(
    { _id: eventId, userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );

  return event ?? null;
}

export async function exportUserData(userId: string) {
  await connectToDatabase();
  const [userEvents, recaps] = await Promise.all([
    listEvents(userId, { limit: 10000 }),
    MonthRecap.find({ userId }).lean(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    events: userEvents,
    monthRecaps: recaps,
  };
}

export async function deleteUserAccount(userId: string) {
  await connectToDatabase();

  await Promise.all([
    Event.deleteMany({ userId }),
    EventBatch.deleteMany({ userId }),
    Want.deleteMany({ userId }),
    SavedActivity.deleteMany({ userId }),
    Hypothesis.deleteMany({ userId }),
    FeedItem.deleteMany({ userId }),
    AnalysisRun.deleteMany({ userId }),
    MonthRecap.deleteMany({ userId }),
    UserSettings.deleteMany({ userId }),
  ]);

  // Remove the auth-adapter records (users/accounts/sessions live in
  // collections managed by the MongoDB adapter, not Mongoose).
  const { ObjectId } = await import("mongodb");
  const client = await clientPromise;
  const adminDb = client.db(DB_NAME);
  let userObjectId: InstanceType<typeof ObjectId> | null = null;
  try {
    userObjectId = new ObjectId(userId);
  } catch {
    userObjectId = null;
  }

  if (userObjectId) {
    await Promise.all([
      adminDb.collection("users").deleteOne({ _id: userObjectId }),
      adminDb.collection("accounts").deleteMany({ userId: userObjectId }),
      adminDb.collection("sessions").deleteMany({ userId: userObjectId }),
    ]);
  }
}
