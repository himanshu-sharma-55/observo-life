import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export type FeedItemType =
  | "observation"
  | "interesting"
  | "change_detected"
  | "pattern"
  | "timeline";

export type FeedItemSource = "rule" | "ai";
export type FeedScope = "current" | "overall";

export interface FeedItemDoc {
  userId: string;
  feedScope?: FeedScope | null;
  analysisRunId?: string | null;
  type: FeedItemType;
  content: string;
  evidenceEventIds: string[];
  source: FeedItemSource;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  dismissedAt?: Date | null;
}

const feedItemSchema = new Schema<FeedItemDoc>(
  {
    userId: { type: String, required: true, index: true },
    feedScope: { type: String, enum: ["current", "overall"], default: null },
    analysisRunId: { type: String, default: null, index: true },
    type: {
      type: String,
      enum: ["observation", "interesting", "change_detected", "pattern", "timeline"],
      default: "observation",
    },
    content: { type: String, required: true },
    evidenceEventIds: { type: [String], default: [] },
    source: { type: String, enum: ["rule", "ai"], default: "rule" },
    metadata: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
    dismissedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

export const FeedItem = getModel<FeedItemDoc>("FeedItem", feedItemSchema);
