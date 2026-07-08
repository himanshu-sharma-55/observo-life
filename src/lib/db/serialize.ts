/** Safe ISO string for API responses — handles Date, string, or missing values. */
export function toIsoString(value: Date | string | undefined | null): string {
  if (value == null) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function documentId(doc: { _id?: unknown; id?: string }): string {
  if (doc.id != null && doc.id !== "") return String(doc.id);
  if (doc._id != null) return String(doc._id);
  return "";
}

export function dbErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.toLowerCase();
  if (
    message.includes("could not connect") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("timed out") ||
    message.includes("server selection")
  ) {
    return "Database connection failed. Check MongoDB Atlas is running and your IP is allowed.";
  }

  if (process.env.NODE_ENV === "development") {
    return error.message;
  }

  return fallback;
}
