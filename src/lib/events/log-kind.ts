export const EVENT_LOG_KINDS = ["moment", "day"] as const;
export type EventLogKind = (typeof EVENT_LOG_KINDS)[number];

export const MOMENT_LOG_MAX_LENGTH = 2000;
export const DAY_LOG_MAX_LENGTH = 8000;

export function isDayLogKind(kind: string | undefined | null): kind is "day" {
  return kind === "day";
}

export function eventLogKindLabel(kind: EventLogKind | undefined | null): string {
  return kind === "day" ? "Day summary" : "Event";
}
