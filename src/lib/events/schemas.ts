import { z } from "zod";
import {
  DAY_LOG_MAX_LENGTH,
  EVENT_LOG_KINDS,
  MOMENT_LOG_MAX_LENGTH,
} from "@/lib/events/log-kind";
import { MAX_EVENT_TAGS, normalizeTags } from "@/lib/events/tags";

const tagsArraySchema = z.array(z.string().max(64)).max(MAX_EVENT_TAGS);
const logDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Tags on create — omitted field becomes []. */
export const createEventTagsSchema = tagsArraySchema
  .optional()
  .transform((tags) => normalizeTags(tags ?? []));

/** Tags on patch — omitted field stays undefined. */
export const patchEventTagsSchema = tagsArraySchema
  .optional()
  .transform((tags) => (tags === undefined ? undefined : normalizeTags(tags)));

export const createEventSchema = z
  .object({
    rawText: z.string().min(1),
    occurredAt: z.string().datetime().optional(),
    logKind: z.enum(EVENT_LOG_KINDS).optional().default("moment"),
    logDay: logDaySchema.optional(),
    tags: createEventTagsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.logKind === "day") {
      if (!data.logDay) {
        ctx.addIssue({
          code: "custom",
          message: "logDay is required for day logs",
          path: ["logDay"],
        });
      }
      if (data.rawText.length > DAY_LOG_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Day summary must be at most ${DAY_LOG_MAX_LENGTH} characters`,
          path: ["rawText"],
        });
      }
      return;
    }

    if (data.rawText.length > MOMENT_LOG_MAX_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Event text must be at most ${MOMENT_LOG_MAX_LENGTH} characters`,
        path: ["rawText"],
      });
    }
  });
