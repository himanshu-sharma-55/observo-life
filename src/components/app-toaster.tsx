"use client";

import { Toaster } from "@/components/ui/sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className: "touch-manipulation",
      }}
      style={
        {
          "--width": "22rem",
        } as React.CSSProperties
      }
    />
  );
}
