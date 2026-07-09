export const TAG_TONE_COUNT = 6;

export function tagToneIndex(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return hash % TAG_TONE_COUNT;
}

export function tagChipClass(tag: string, interactive = false): string {
  const tone = tagToneIndex(tag);
  return [
    "tag-chip",
    `tag-chip-tone-${tone}`,
    interactive ? "tag-chip-interactive" : null,
  ]
    .filter(Boolean)
    .join(" ");
}
