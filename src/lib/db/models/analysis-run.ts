import { Schema } from "mongoose";
import { baseSchemaOptions, getModel } from "./base";
import type { RecapInsight } from "./month-recap";

export interface AnalysisRunDoc {
  userId: string;
  sequence: number;
  previousRunId?: string | null;
  periodStart: Date;
  periodEnd: Date;
  overallWindowStart?: Date | null;
  overallWindowEnd?: Date | null;
  currentInsights?: RecapInsight[] | null;
  overallInsights?: RecapInsight[] | null;
  model?: string | null;
  promptVersion?: string | null;
  durationMs?: number | null;
  summary?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  observations?: unknown;
  wantsAlignment?: unknown;
  createdAt: Date;
}

const analysisRunSchema = new Schema<AnalysisRunDoc>(
  {
    userId: { type: String, required: true, index: true },
    sequence: { type: Number, default: 1 },
    previousRunId: { type: String, default: null },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    overallWindowStart: { type: Date, default: null },
    overallWindowEnd: { type: Date, default: null },
    currentInsights: { type: Schema.Types.Mixed, default: [] },
    overallInsights: { type: Schema.Types.Mixed, default: [] },
    model: { type: String, default: null },
    promptVersion: { type: String, default: null },
    durationMs: { type: Number, default: null },
    summary: { type: Schema.Types.Mixed, default: null },
    changes: { type: Schema.Types.Mixed, default: null },
    observations: { type: Schema.Types.Mixed, default: null },
    wantsAlignment: { type: Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  baseSchemaOptions,
);

analysisRunSchema.index({ userId: 1, createdAt: -1 });
analysisRunSchema.index({ userId: 1, sequence: -1 });

export const AnalysisRun = getModel<AnalysisRunDoc>("AnalysisRun", analysisRunSchema);
