import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";
import type { EventLogKind } from "@/lib/events/log-kind";

export interface EventDoc {
  userId: string;
  batchId?: string | null;
  rawText: string;
  occurredAt: Date;
  logKind: EventLogKind;
  tags: string[];
  parsed?: Record<string, unknown> | null;
  amount?: number | null;
  currency?: string | null;
  createdAt: Date;
  deletedAt?: Date | null;
}

const eventSchema = new Schema<EventDoc>(
  {
    userId: { type: String, required: true },
    batchId: { type: String, default: null },
    rawText: { type: String, required: true },
    occurredAt: { type: Date, required: true },
    logKind: { type: String, enum: ["moment", "day"], default: "moment" },
    tags: { type: [String], default: [] },
    parsed: { type: Schema.Types.Mixed, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

eventSchema.index({ userId: 1, occurredAt: -1 });
eventSchema.index({ userId: 1, tags: 1 });
eventSchema.index({ userId: 1, logKind: 1, occurredAt: -1 });

export const Event = getModel<EventDoc>("Event", eventSchema);
