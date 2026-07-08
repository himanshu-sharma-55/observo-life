/** True on phones/tablets with touch-first input (no Shift+Enter for newlines). */
export function isCoarsePointerDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}
