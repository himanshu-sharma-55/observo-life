import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export interface EventBatchDoc {
  userId: string;
  rawText: string;
  submittedAt: Date;
}

const eventBatchSchema = new Schema<EventBatchDoc>(
  {
    userId: { type: String, required: true, index: true },
    rawText: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

export const EventBatch = getModel<EventBatchDoc>("EventBatch", eventBatchSchema);
