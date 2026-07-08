import { connectToDatabase } from "@/lib/db";
import { Want } from "@/lib/db/models";

export async function listWants(userId: string) {
  await connectToDatabase();
  return Want.find({ userId, deletedAt: null }).sort({ createdAt: -1 });
}

export async function createWant(
  userId: string,
  input: { title: string; description?: string; keywords?: string[] },
) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");

  await connectToDatabase();

  return Want.create({
    userId,
    title,
    description: input.description?.trim() || null,
    keywords: [],
  });
}

export async function updateWant(
  userId: string,
  wantId: string,
  input: { title?: string; description?: string; keywords?: string[] },
) {
  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) {
    updates.description = input.description.trim() || null;
  }
  if (input.keywords !== undefined) {
    updates.keywords = input.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
  }

  await connectToDatabase();

  const want = await Want.findOneAndUpdate(
    { _id: wantId, userId, deletedAt: null },
    { $set: updates },
    { new: true },
  );

  return want ?? null;
}

export async function deleteWant(userId: string, wantId: string) {
  await connectToDatabase();

  const want = await Want.findOneAndUpdate(
    { _id: wantId, userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );

  return want ?? null;
}
