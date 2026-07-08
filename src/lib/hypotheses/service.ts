import { connectToDatabase } from "@/lib/db";
import { Hypothesis } from "@/lib/db/models";

export async function listHypotheses(userId: string) {
  await connectToDatabase();
  return Hypothesis.find({ userId, deletedAt: null }).sort({ createdAt: -1 });
}

export async function createHypothesis(
  userId: string,
  input: { statement: string; keywords?: string[] },
) {
  const statement = input.statement.trim();
  if (!statement) throw new Error("Statement is required");

  await connectToDatabase();

  return Hypothesis.create({ userId, statement, keywords: [] });
}

export async function updateHypothesis(
  userId: string,
  hypothesisId: string,
  input: { statement?: string; keywords?: string[] },
) {
  const updates: Record<string, unknown> = {};
  if (input.statement !== undefined) updates.statement = input.statement.trim();
  if (input.keywords !== undefined) {
    updates.keywords = input.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean);
  }

  await connectToDatabase();

  const hypothesis = await Hypothesis.findOneAndUpdate(
    { _id: hypothesisId, userId, deletedAt: null },
    { $set: updates },
    { new: true },
  );

  return hypothesis ?? null;
}

export async function deleteHypothesis(userId: string, hypothesisId: string) {
  await connectToDatabase();

  const hypothesis = await Hypothesis.findOneAndUpdate(
    { _id: hypothesisId, userId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );

  return hypothesis ?? null;
}
