import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export type HypothesisStatus =
  | "supported"
  | "moderately_supported"
  | "not_supported_yet";

export interface HypothesisDoc {
  userId: string;
  statement: string;
  keywords: string[];
  status: HypothesisStatus;
  createdAt: Date;
  deletedAt?: Date | null;
}

const hypothesisSchema = new Schema<HypothesisDoc>(
  {
    userId: { type: String, required: true, index: true },
    statement: { type: String, required: true },
    keywords: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["supported", "moderately_supported", "not_supported_yet"],
      default: "not_supported_yet",
    },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

export const Hypothesis = getModel<HypothesisDoc>("Hypothesis", hypothesisSchema);
