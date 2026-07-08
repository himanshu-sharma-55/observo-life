import { useId } from "react";
import { cn } from "@/lib/utils";

type BrandIconProps = {
  className?: string;
  /** Tile: cream card with border. Mark: stacked stones only. */
  variant?: "mark" | "tile";
  size?: number;
};

function BrandStones({ id }: { id: string }) {
  return (
    <g filter={`url(#${id}-shadow)`}>
      <ellipse cx="17" cy="31.2" rx="10" ry="1.2" fill={`url(#${id}-ground)`} opacity="0.55" />

      <path d="M5 30Q17 20.5 29 30Z" fill={`url(#${id}-navy)`} />
      <path
        d="M7 28.5Q17 22 27 28.5"
        fill="none"
        stroke="white"
        strokeWidth="0.6"
        opacity="0.12"
      />

      <path d="M8 24.2Q17 16.8 26 24.2Z" fill={`url(#${id}-teal)`} />
      <path
        d="M10 22.8Q17 18 24 22.8"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.18"
      />

      <path d="M11 21Q17 14.5 23 21Z" fill={`url(#${id}-slate)`} />
      <path
        d="M12.5 19.8Q17 15.5 21.5 19.8"
        fill="none"
        stroke="white"
        strokeWidth="0.45"
        opacity="0.2"
      />

      <circle cx="17" cy="12.6" r="3.2" fill={`url(#${id}-top)`} />
      <circle cx="15.6" cy="11.4" r="0.8" fill="white" opacity="0.38" />
    </g>
  );
}

export function BrandIcon({
  className,
  variant = "mark",
  size = 36,
}: BrandIconProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const isTile = variant === "tile";

  return (
    <svg
      viewBox={isTile ? "0 0 48 48" : "0 0 34 34"}
      width={size}
      height={size}
      role="img"
      aria-label="Observolife"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={`${id}-navy`} x1="17" y1="20" x2="17" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2a3f5f" />
          <stop offset="1" stopColor="#152338" />
        </linearGradient>
        <linearGradient id={`${id}-teal`} x1="17" y1="16" x2="17" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6db5a6" />
          <stop offset="0.55" stopColor="#4f9488" />
          <stop offset="1" stopColor="#3d7a6f" />
        </linearGradient>
        <linearGradient id={`${id}-slate`} x1="17" y1="14" x2="17" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a8bac8" />
          <stop offset="1" stopColor="#7f96a8" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="14" y1="10" x2="20" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b8d4e0" />
          <stop offset="0.45" stopColor="#7eb8b0" />
          <stop offset="1" stopColor="#5a9e92" />
        </linearGradient>
        <radialGradient id={`${id}-ground`} cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#1e2d4a" />
          <stop offset="1" stopColor="#1e2d4a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-cream`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#faf7f2" />
          <stop offset="1" stopColor="#efe8df" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#0f1a2e" floodOpacity="0.22" />
        </filter>
        <filter id={`${id}-tile-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#1e2d4a" floodOpacity="0.18" />
        </filter>
      </defs>

      {isTile ? (
        <g filter={`url(#${id}-tile-glow)`}>
          <rect x="2" y="2" width="44" height="44" rx="12" fill={`url(#${id}-cream)`} />
          <rect
            x="2.5"
            y="2.5"
            width="43"
            height="43"
            rx="11.5"
            fill="none"
            stroke="#1e2d4a"
            strokeWidth="2.5"
          />
          <rect
            x="4"
            y="4"
            width="40"
            height="40"
            rx="10"
            fill="none"
            stroke="white"
            strokeWidth="0.75"
            opacity="0.45"
          />
          <g transform="translate(7, 3.5)">
            <BrandStones id={id} />
          </g>
        </g>
      ) : (
        <g transform="translate(0, 0.5)">
          <BrandStones id={id} />
        </g>
      )}
    </svg>
  );
}
