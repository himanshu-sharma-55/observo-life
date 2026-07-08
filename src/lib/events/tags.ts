export const MAX_EVENT_TAGS = 8;
export const MAX_EVENT_TAG_LENGTH = 32;
export const RECENT_EVENT_TAGS_KEY = "observolife.recent-event-tags";
export const MAX_RECENT_EVENT_TAGS = 12;

export function normalizeTags(input: string[] | undefined | null): string[] {
  if (!input?.length) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of input) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "")
      .slice(0, MAX_EVENT_TAG_LENGTH);

    if (tag.length === 0 || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= MAX_EVENT_TAGS) break;
  }

  return tags;
}

export function parseTagsInput(value: string): string[] {
  return normalizeTags(value.split(","));
}

export function normalizeTagInput(raw: string): string {
  return normalizeTags([raw])[0] ?? "";
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export function loadRecentEventTags(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(RECENT_EVENT_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeTags(parsed.map(String));
  } catch {
    return [];
  }
}

export function rememberEventTags(tags: string[]) {
  if (typeof window === "undefined" || tags.length === 0) return;

  const merged = normalizeTags([...tags, ...loadRecentEventTags()]).slice(
    0,
    MAX_RECENT_EVENT_TAGS,
  );

  try {
    localStorage.setItem(RECENT_EVENT_TAGS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}
