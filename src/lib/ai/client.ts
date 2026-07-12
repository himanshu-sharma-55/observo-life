import {
  FALLBACK_GEMINI_MODEL,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_MAX_RETRIES,
  GEMINI_TIMEOUT_MS,
  getGeminiModel,
} from "@/lib/ai/constants";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI is not configured. Set GEMINI_API_KEY in your environment.");
    this.name = "AiNotConfiguredError";
  }
}

export function isAiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

type GenerateOptions = {
  system: string;
  prompt: string;
  /** A JSON schema (Gemini "responseSchema" shape) describing the expected output. */
  responseSchema?: Record<string, unknown>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseGeminiErrorBody(detail: string): string | null {
  try {
    const parsed = JSON.parse(detail) as { error?: { message?: string } };
    return parsed.error?.message?.trim() ?? null;
  } catch {
    return detail.trim() || null;
  }
}

export function formatGeminiApiError(status: number, detail: string, model: string): string {
  const message = parseGeminiErrorBody(detail);

  if (status === 404) {
    if (message?.includes("no longer available")) {
      return `Gemini model "${model}" is no longer available. Set GEMINI_MODEL=${FALLBACK_GEMINI_MODEL} in your environment.`;
    }
    return message ?? `Gemini model "${model}" was not found.`;
  }

  if (status === 429) {
    return "Google AI rate limit hit. Wait a minute and try again — failed attempts do not use your Observolife quota.";
  }

  if (status === 403) {
    return message ?? "Gemini API key is invalid or does not have access to this model.";
  }

  return message ?? `Gemini request failed (${status}).`;
}

function isDeprecatedModelError(status: number, detail: string) {
  return status === 404 && detail.includes("no longer available");
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Gemini request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGeminiModel(
  model: string,
  apiKey: string,
  body: string,
): Promise<string> {
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(500 * 2 ** (attempt - 1));
    }

    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body,
        },
        GEMINI_TIMEOUT_MS,
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        const error = new Error(formatGeminiApiError(response.status, detail, model));
        (error as Error & { status?: number; detail?: string }).status = response.status;
        (error as Error & { status?: number; detail?: string }).detail = detail;

        if (RETRYABLE_STATUSES.has(response.status) && attempt < GEMINI_MAX_RETRIES) {
          lastError = error;
          continue;
        }

        throw error;
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };

      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("");
      if (!text) throw new Error("Gemini returned an empty response.");

      return text;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (attempt < GEMINI_MAX_RETRIES && !err.message.includes("timed out")) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("Gemini request failed.");
}

/**
 * Calls the Gemini Developer API and returns the raw text of the first
 * candidate. When a responseSchema is provided we force JSON output so the
 * caller can parse + validate it.
 */
export async function generateStructured({
  system,
  prompt,
  responseSchema,
}: GenerateOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  const primaryModel = getGeminiModel();
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      ...(responseSchema ? { responseSchema } : {}),
    },
  });

  try {
    return await callGeminiModel(primaryModel, apiKey, body);
  } catch (error) {
    const err = error as Error & { status?: number; detail?: string };

    if (primaryModel !== FALLBACK_GEMINI_MODEL) {
      if (
        err.status === 404 &&
        err.detail &&
        isDeprecatedModelError(err.status, err.detail)
      ) {
        console.warn(
          `[ai] model "${primaryModel}" unavailable; falling back to ${FALLBACK_GEMINI_MODEL}`,
        );
        return callGeminiModel(FALLBACK_GEMINI_MODEL, apiKey, body);
      }

      if (err.status === 429) {
        console.warn(
          `[ai] model "${primaryModel}" rate limited; trying ${FALLBACK_GEMINI_MODEL}`,
        );
        try {
          return await callGeminiModel(FALLBACK_GEMINI_MODEL, apiKey, body);
        } catch (fallbackError) {
          throw error;
        }
      }
    }

    throw error;
  }
}
