export function isPortaledOverlay(target: Node): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      [
        "[data-event-tags-listbox]",
        '[role="listbox"]',
        '[role="dialog"]',
        '[data-slot="sheet-content"]',
        '[data-slot="select-content"]',
        '[data-slot="popover-content"]',
      ].join(","),
    ),
  );
}
