/** Returns YYYY-MM for a date in the given IANA timezone. */
export function formatMonthKey(date: Date, timezone = "UTC"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

/** Inclusive start/end of a calendar month in the given timezone (approx via UTC offset parsing). */
export function getMonthBounds(monthKey: string, timezone = "UTC"): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  // Use noon UTC on the 1st to avoid DST edge cases when formatting
  const start = zonedMonthStart(year, month, timezone);
  const end = zonedMonthEnd(year, month, timezone);
  return { start, end };
}

function zonedMonthStart(year: number, month: number, timezone: string): Date {
  const guess = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const offset = getTimezoneOffsetMs(guess, timezone);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0) - offset);
}

function zonedMonthEnd(year: number, month: number, timezone: string): Date {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const guess = new Date(Date.UTC(year, month - 1, lastDay, 12, 0, 0));
  const offset = getTimezoneOffsetMs(guess, timezone);
  return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999) - offset);
}

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), 0, 0);
  return asUtc - date.getTime();
}

/** Previous calendar month key (YYYY-MM). */
export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Most recently completed calendar month in timezone. */
export function lastCompletedMonthKey(timezone = "UTC"): string {
  const now = new Date();
  const current = formatMonthKey(now, timezone);
  return previousMonthKey(current);
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}
