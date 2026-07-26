import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-marketing-display",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-marketing-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Observolife · Observe your life",
  description:
    "A personal observation engine. Log what happened in plain language, then ask AI for evidence-backed patterns without streaks, judgment, or goals.",
  openGraph: {
    title: "Observolife · Observe your life",
    description:
      "Log life as it happens. Discover the patterns you're too close to see. Private, evidence-first, on demand.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Observolife · Observe your life",
    description:
      "A calm AI space to log what happened and notice what your life is quietly showing you.",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${jakarta.variable} marketing-root min-h-dvh bg-[#eef1f6] font-[family-name:var(--font-marketing-sans)] text-[#0a1220] antialiased`}
    >
      {children}
    </div>
  );
}
