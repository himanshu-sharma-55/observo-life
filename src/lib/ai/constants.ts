/** Minimum wait between feed AI runs (anti double-click / spam). */
export const MIN_FEED_COOLDOWN_MS = 5 * 60 * 1000;

/** Hard cap on feed AI runs per user per hour. */
export const MAX_FEED_AI_PER_HOUR = 6;

/** Hard cap on recap generation attempts per user per hour. */
export const MAX_RECAP_GENERATE_PER_HOUR = 3;

/** How long a generation lock is considered active. */
export const AI_LOCK_TTL_MS = 3 * 60 * 1000;

/** Analysis runs (and their feed items) to retain per user. */
export const FEED_RUNS_TO_KEEP = 10;

export const EVENT_TEXT_MAX_CHARS = 800;

/** Events included in the current-week AI prompt. */
export const CURRENT_PROMPT_MAX_EVENTS = 50;

/** Events sampled for month recap prompts. */
export const RECAP_EVENT_SAMPLE_SIZE = 40;

export const RECAP_MAX_WANTS = 40;
export const RECAP_MAX_HYPOTHESES = 40;
export const RECAP_MAX_MONTH_OVERALL_ITEMS = 20;

export const GEMINI_TIMEOUT_MS = 60_000;
export const GEMINI_MAX_OUTPUT_TOKENS = 4096;
export const GEMINI_MAX_RETRIES = 2;

/** Default model for feed insights and month recaps (override via GEMINI_MODEL). */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-pro";

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

export const PROMPT_VERSION = "2026-06-22-v4";
