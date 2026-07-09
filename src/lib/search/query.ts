import type { PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Event } from "@/lib/db/models";
import { normalizeTags } from "@/lib/events/tags";

export type SearchOptions = {
  q?: string;
  from?: Date;
  to?: Date;
  minAmount?: number;
  tag?: string;
  limit?: number;
  skip?: number;
  sort?: "asc" | "desc";
};

/** Name of the Atlas Search index defined on the `events` collection. */
const ATLAS_SEARCH_INDEX = "events_search";

export async function searchEvents(userId: string, options: SearchOptions) {
  await connectToDatabase();

  const limit = options.limit ?? 50;
  const skip = options.skip ?? 0;
  const query = options.q?.trim();

  // No text query -> plain filtered find.
  if (!query) {
    const filter = buildFilter(userId, options);
    return Event.find(filter)
      .sort({ occurredAt: sortOrder(options) })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Text query -> Atlas Search aggregation with structured filters.
  const filterClauses: Record<string, unknown>[] = [
    { equals: { path: "userId", value: userId } },
  ];

  if (options.from || options.to) {
    const range: Record<string, unknown> = { path: "occurredAt" };
    if (options.from) range.gte = options.from;
    if (options.to) range.lte = options.to;
    filterClauses.push({ range });
  }

  if (options.tag) {
    const tag = normalizeTags([options.tag])[0];
    if (tag) {
      filterClauses.push({ equals: { path: "tags", value: tag } });
    }
  }

  const pipeline: Record<string, unknown>[] = [
    {
      $search: {
        index: ATLAS_SEARCH_INDEX,
        compound: {
          must: [
            {
              text: {
                query,
                path: "rawText",
                fuzzy: { maxEdits: 1 },
              },
            },
          ],
          filter: filterClauses,
        },
      },
    },
    // Atlas Search cannot filter out soft-deleted docs via `equals` on null,
    // so apply remaining predicates with a normal $match stage.
    { $match: buildMatch(options) },
    { $sort: { occurredAt: -1 } },
    ...(skip > 0 ? [{ $skip: skip }] : []),
    { $limit: limit },
  ];

  try {
    const docs = await Event.aggregate(pipeline as unknown as PipelineStage[]);
    return docs.map(normalizeAggregateDoc);
  } catch (error) {
    // Atlas Search isn't available (e.g. local MongoDB Community, or the index
    // hasn't finished provisioning). Fall back to a case-insensitive regex.
    if (!isMissingSearchIndexError(error)) throw error;

    const filter = buildFilter(userId, options);
    filter.rawText = { $regex: escapeRegex(query), $options: "i" };
    return Event.find(filter)
      .sort({ occurredAt: sortOrder(options) })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

function isMissingSearchIndexError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /\$search/i.test(message) ||
    /search index/i.test(message) ||
    /Unrecognized pipeline stage/i.test(message) ||
    /PlanExecutor error/i.test(message)
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(userId: string, options: SearchOptions) {
  const filter: Record<string, unknown> = { userId, deletedAt: null };

  if (options.from || options.to) {
    const occurredAt: Record<string, Date> = {};
    if (options.from) occurredAt.$gte = options.from;
    if (options.to) occurredAt.$lte = options.to;
    filter.occurredAt = occurredAt;
  }

  if (options.minAmount !== undefined) {
    filter.amount = { $gte: options.minAmount };
  }

  if (options.tag) {
    const tag = normalizeTags([options.tag])[0];
    if (tag) filter.tags = tag;
  }

  return filter;
}

function sortOrder(options: SearchOptions) {
  return options.sort === "asc" ? 1 : -1;
}

function buildMatch(options: SearchOptions) {
  const match: Record<string, unknown> = { deletedAt: null };
  if (options.minAmount !== undefined) {
    match.amount = { $gte: options.minAmount };
  }
  if (options.tag) {
    const tag = normalizeTags([options.tag])[0];
    if (tag) match.tags = tag;
  }
  return match;
}

/** Aggregations return raw BSON; expose `id` like Mongoose toJSON does. */
function normalizeAggregateDoc(doc: Record<string, unknown>) {
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}
