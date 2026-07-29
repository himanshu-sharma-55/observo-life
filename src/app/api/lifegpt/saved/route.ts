import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db";
import { LifeGptSaved } from "@/lib/db/models";

const evidenceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  occurredAt: z.string().min(1),
  tags: z.array(z.string()).default([]),
});

const saveSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  answer: z.string().trim().min(1).max(8000),
  suggestion: z.string().trim().min(1).max(8000),
  evidence: z.array(evidenceSchema).max(10).default([]),
});

function serialize(doc: {
  _id: unknown;
  question: string;
  answer: string;
  suggestion: string;
  evidence: unknown[];
  createdAt: Date;
}) {
  return {
    id: String(doc._id),
    question: doc.question,
    answer: doc.answer,
    suggestion: doc.suggestion,
    evidence: doc.evidence,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    await connectToDatabase();

    const docs = await LifeGptSaved.find({ userId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      saved: docs.map((doc) => serialize(doc)),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to load saved LifeGPT notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid save payload.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await connectToDatabase();
    const doc = await LifeGptSaved.create({
      userId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      suggestion: parsed.data.suggestion,
      evidence: parsed.data.evidence,
    });

    return NextResponse.json({ saved: serialize(doc.toObject()) }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to save LifeGPT note" }, { status: 500 });
  }
}
