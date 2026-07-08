import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";

export interface UserSettingsDoc {
  userId: string;
  timezone: string;
  analysisIntervalDays: number;
  analysisAnchorDay: string;
  lastAnalysisAt?: Date | null;
  aiFeedLockedUntil?: Date | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<UserSettingsDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    timezone: { type: String, default: "UTC" },
    analysisIntervalDays: { type: Number, default: 7 },
    analysisAnchorDay: { type: String, default: "sunday" },
    lastAnalysisAt: { type: Date, default: null },
    aiFeedLockedUntil: { type: Date, default: null },
    currency: { type: String, default: "INR" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

export const UserSettings = getModel<UserSettingsDoc>("UserSettings", userSettingsSchema);
