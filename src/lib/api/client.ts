export async function readApiError(
  response: Response,
  fallback = "Something went wrong.",
): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error?.trim() || fallback;
  } catch {
    return fallback;
  }
}
