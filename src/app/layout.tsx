import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppToaster } from "@/components/app-toaster";
import { MobileInputScroll } from "@/components/mobile-input-scroll";
import { INITIAL_THEME_SCRIPT } from "@/lib/theme/initial-theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Observolife",
    template: "%s · Observolife",
  },
  description:
    "A personal observation engine — log what happened and discover the patterns you're too close to see.",
  applicationName: "Observolife",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Observolife",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#141a24" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} min-h-full bg-canvas`}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html { background-color: #f7f8fa; color: #1a2332; }
              html.dark { background-color: #141a24; color: #f5f7fa; }
            `,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: INITIAL_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-canvas text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OfflineSyncProvider>
            <MobileInputScroll />
            {children}
            <AppToaster />
          </OfflineSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
