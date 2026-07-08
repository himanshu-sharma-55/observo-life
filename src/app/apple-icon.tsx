import { ImageResponse } from "next/og";
import { getFaviconSvg } from "@/lib/brand/favicon-svg";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const svg = getFaviconSvg();

  return new ImageResponse(
    (
      <img
        alt=""
        src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
        width={180}
        height={180}
      />
    ),
    { ...size },
  );
}
