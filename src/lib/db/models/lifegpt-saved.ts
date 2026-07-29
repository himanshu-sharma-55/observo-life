import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export type LifeGptSavedEvidence = {
  id: string;
  text: string;
  occurredAt: string;
  tags: string[];
};

export interface LifeGptSavedDoc {
  userId: string;
  question: string;
  answer: string;
  suggestion: string;
  evidence: LifeGptSavedEvidence[];
  createdAt: Date;
  deletedAt?: Date | null;
}

const evidenceSchema = new Schema<LifeGptSavedEvidence>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    occurredAt: { type: String, required: true },
    tags: { type: [String], default: [] },
  },
  { _id: false },
);

const lifeGptSavedSchema = new Schema<LifeGptSavedDoc>(
  {
    userId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    suggestion: { type: String, required: true },
    evidence: { type: [evidenceSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

lifeGptSavedSchema.index({ userId: 1, createdAt: -1 });

export const LifeGptSaved = getModel<LifeGptSavedDoc>("LifeGptSaved", lifeGptSavedSchema);
