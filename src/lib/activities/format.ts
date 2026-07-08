export type SavedActivityLike = {
  title: string;
  text?: string | null;
};

export function activityLogText(activity: SavedActivityLike): string {
  const details = activity.text?.trim();
  if (details) return details;
  return activity.title.trim();
}

export function appendActivityLines(existing: string, lines: string[]): string {
  const chunk = lines.map((line) => line.trim()).filter(Boolean).join("\n");
  if (!chunk) return existing;
  const trimmed = existing.trim();
  return trimmed ? `${trimmed}\n${chunk}` : chunk;
}

export function removeActivityLine(existing: string, line: string): string {
  const target = line.trim();
  if (!target) return existing;

  const lines = existing.split("\n");
  const index = lines.findIndex((entry) => entry.trim() === target);
  if (index === -1) return existing;

  lines.splice(index, 1);
  return lines.join("\n").trim();
}
