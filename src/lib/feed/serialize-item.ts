import type { FeedItemDoc } from "@/lib/db/models";
import { documentId, toIsoString } from "@/lib/db/serialize";

export type SerializedFeedItem = {
  id: string;
  type: string;
  content: string;
  title?: string;
  body?: string;
  takeaway?: string;
  source: string;
  evidenceEventIds: string[] | null;
  createdAt: string;
};

export function serializeFeedItem(
  item: FeedItemDoc & { _id?: unknown; id?: string },
): SerializedFeedItem {
  const metadata = item.metadata as Record<string, unknown> | null | undefined;
  const title = typeof metadata?.title === "string" ? metadata.title : undefined;
  const body = typeof metadata?.body === "string" ? metadata.body : undefined;
  const takeaway = typeof metadata?.takeaway === "string" ? metadata.takeaway : undefined;

  return {
    id: documentId(item),
    type: item.type,
    content: item.content,
    title,
    body: body ?? item.content,
    takeaway,
    source: item.source,
    evidenceEventIds: item.evidenceEventIds ?? [],
    createdAt: toIsoString(item.createdAt),
  };
}
