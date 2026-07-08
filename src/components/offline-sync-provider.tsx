"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import { registerOfflineSync } from "@/lib/offline/queue";

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerOfflineSync(async (payload) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to sync offline event."));
      }
    });
  }, []);

  useEffect(() => {
    const onSyncError = () => {
      toast.error("Some offline events could not sync. They will retry when you're back online.");
    };

    window.addEventListener("observolife-offline-sync-error", onSyncError);
    return () => window.removeEventListener("observolife-offline-sync-error", onSyncError);
  }, []);

  return children;
}
