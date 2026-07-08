/** Parse YYYY-MM-DD from a date input as local start/end of day. */
export function localDayStart(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function localDayEnd(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

/** Anchor day logs at local noon so they sort naturally among same-day events. */
export function localDayAnchor(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}
