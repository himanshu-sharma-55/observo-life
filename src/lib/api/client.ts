export async function readApiError(
  response: Response,
  fallback = "Something went wrong.",
  parsed?: { error?: string },
): Promise<string> {
  if (parsed?.error?.trim()) return parsed.error.trim();

  try {
    const data = (await response.json()) as { error?: string };
    return data.error?.trim() || fallback;
  } catch {
    return fallback;
  }
}
