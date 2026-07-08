import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export interface WantDoc {
  userId: string;
  title: string;
  description?: string | null;
  keywords: string[];
  createdAt: Date;
  deletedAt?: Date | null;
}

const wantSchema = new Schema<WantDoc>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    keywords: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

export const Want = getModel<WantDoc>("Want", wantSchema);
