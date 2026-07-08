/** Favicon mark — chunky shapes, flat fills, no filters (reads at 16px). */
export function getFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#f5f3ef"/>
  <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="6.25" fill="none" stroke="#1e2d4a" stroke-width="2"/>
  <path d="M3.5 23.5Q16 15.5 28.5 23.5Z" fill="#1e2d4a"/>
  <path d="M6.5 19Q16 13 25.5 19Z" fill="#4f9488"/>
  <circle cx="16" cy="10" r="3.15" fill="#7eb8b0"/>
</svg>`;
}
