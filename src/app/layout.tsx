import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppToaster } from "@/components/app-toaster";
import { MobileInputScroll } from "@/components/mobile-input-scroll";
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
  title: "Observolife",
  description: "A personal observation engine for your life.",
  applicationName: "Observolife",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Observolife",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1e2d4a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-visual",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased">
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
