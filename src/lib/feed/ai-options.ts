import { z } from "zod";

export const AiFeedOptionsSchema = z
  .object({
    includeCurrent: z.boolean(),
    includeOverall: z.boolean(),
    includeWants: z.boolean(),
    includeBeliefs: z.boolean(),
  })
  .refine((options) => options.includeCurrent || options.includeOverall, {
    message: "Select at least one insight type.",
  });

export type AiFeedOptions = z.infer<typeof AiFeedOptionsSchema>;

export type FeedPromptContext = {
  wants?: { title: string; description?: string | null }[];
  beliefs?: { statement: string }[];
};

export const DEFAULT_AI_FEED_OPTIONS: AiFeedOptions = {
  includeCurrent: true,
  includeOverall: true,
  includeWants: true,
  includeBeliefs: true,
};

export const AI_FEED_OPTIONS_STORAGE_KEY = "observolife.ai-feed-options";

export function parseAiFeedOptions(input: unknown): AiFeedOptions {
  const parsed = AiFeedOptionsSchema.safeParse(input);
  if (parsed.success) return parsed.data;
  return DEFAULT_AI_FEED_OPTIONS;
}
