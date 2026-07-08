import { connectToDatabase } from "@/lib/db";
import { documentId } from "@/lib/db/serialize";
import { SavedActivity } from "@/lib/db/models";
import { normalizeTags } from "@/lib/events/tags";

export type SerializedSavedActivity = {
  id: string;
  title: string;
  text: string | null;
  tags: string[];
};

function serializeActivity(doc: {
  _id?: unknown;
  id?: string;
  title?: string;
  text?: string | null;
  tags?: string[] | null;
}): SerializedSavedActivity {
  return {
    id: documentId(doc),
    title: doc.title ?? "",
    text: doc.text ?? null,
    tags: normalizeTags(doc.tags),
  };
}

export async function listSavedActivities(
  userId: string,
  query?: string,
): Promise<SerializedSavedActivity[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = { userId, deletedAt: null };

  if (query?.trim()) {
    const q = query.trim();
    filter.title = { $regex: q, $options: "i" };
  }

  const docs = await SavedActivity.find(filter).sort({ title: 1 }).lean();
  return docs.map((doc) => serializeActivity(doc));
}

export async function createSavedActivity(
  userId: string,
  input: { title: string; text?: string; tags?: string[] },
) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  await connectToDatabase();

  const activity = await SavedActivity.create({
    userId,
    title,
    text: input.text?.trim() || null,
    tags: normalizeTags(input.tags),
  });

  return serializeActivity(activity);
}

export async function updateSavedActivity(
  userId: string,
  activityId: string,
  input: { title?: string; text?: string; tags?: string[] },
) {
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error("Title is required");
    updates.title = title;
  }

  if (input.text !== undefined) {
    updates.text = input.text.trim() || null;
  }

  if (input.tags !== undefined) {
    updates.tags = normalizeTags(input.tags);
  }

  if (Object.keys(updates).length === 0) return null;

  await connectToDatabase();

  const activity = await SavedActivity.findOneAndUpdate(
    { _id: activityId, userId, deletedAt: null },
    { $set: updates },
    { new: true },
  );

  return activity ? serializeActivity(activity) : null;
}

export async function deleteSavedActivity(userId: string, activityId: string) {
  await connectToDatabase();

  const activity = await SavedActivity.findOneAndUpdate(
    { _id: activityId, userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );

  return activity ? serializeActivity(activity) : null;
}
