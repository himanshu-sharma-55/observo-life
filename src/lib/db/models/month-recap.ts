import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";
import type { FeedItemType } from "./feed-item";

export type RecapInsight = {
  type: FeedItemType;
  title?: string;
  body?: string;
  takeaway?: string;
  content: string;
  evidenceEventIds: string[];
};

export type RecapSection = {
  id: string;
  kind: "stat" | "highlight" | "surprise" | "pattern";
  title: string;
  body: string;
  stat?: { label: string; value: string };
  evidenceEventIds?: string[];
};

export type MonthRecapStats = {
  totalEvents: number;
  activeDays: number;
  daysInMonth: number;
  busiestDay: { day: string; count: number } | null;
  vsLastMonth: {
    events: number | null;
    activeDays: number | null;
    spending: number | null;
  };
  topSignals: { signal: string; label: string; count: number }[];
  spending: { total: number; count: number };
  weeklyRhythm: { week: number; count: number }[];
  firstEventAt: Date | null;
  lastEventAt: Date | null;
  isFirstMonth: boolean;
};

export interface MonthRecapDoc {
  userId: string;
  month: string;
  stats: MonthRecapStats;
  headline: string;
  sections: RecapSection[];
  surpriseInsights: RecapInsight[];
  compactInsights: RecapInsight[];
  sourceRunIds: string[];
  sourceItemIds: string[];
  generatedAt: Date;
  viewedAt?: Date | null;
  generatingAt?: Date | null;
  model: string;
}

const monthRecapSchema = new Schema<MonthRecapDoc>(
  {
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true },
    stats: { type: Schema.Types.Mixed, required: true },
    headline: { type: String, default: "" },
    sections: { type: Schema.Types.Mixed, default: [] },
    surpriseInsights: { type: Schema.Types.Mixed, default: [] },
    compactInsights: { type: Schema.Types.Mixed, default: [] },
    sourceRunIds: { type: [String], default: [] },
    sourceItemIds: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
    viewedAt: { type: Date, default: null },
    generatingAt: { type: Date, default: null },
    model: { type: String, default: "" },
  },
  baseSchemaOptions,
);

monthRecapSchema.index({ userId: 1, month: 1 }, { unique: true });

export const MonthRecap = getModel<MonthRecapDoc>("MonthRecap", monthRecapSchema);
