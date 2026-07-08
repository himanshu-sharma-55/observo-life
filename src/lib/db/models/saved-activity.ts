import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export interface SavedActivityDoc {
  userId: string;
  title: string;
  text?: string | null;
  tags: string[];
  createdAt: Date;
  deletedAt?: Date | null;
}

const savedActivitySchema = new Schema<SavedActivityDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    text: { type: String, default: null },
    tags: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

savedActivitySchema.index({ userId: 1, title: 1 });

export const SavedActivity = getModel<SavedActivityDoc>(
  "SavedActivity",
  savedActivitySchema,
);
