import { ImageResponse } from "next/og";
import { getFaviconSvg } from "@/lib/brand/favicon-svg";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const svg = getFaviconSvg();

  return new ImageResponse(
    (
      <img
        alt=""
        src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
        width={32}
        height={32}
      />
    ),
    { ...size },
  );
}
