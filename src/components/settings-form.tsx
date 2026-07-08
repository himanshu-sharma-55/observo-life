"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Settings = {
  timezone: string;
  analysisIntervalDays: number;
  analysisAnchorDay: string;
  currency: string;
};

export function SettingsForm({ showAiSettings = true }: { showAiSettings?: boolean }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load settings."));
      }

      const data = await response.json();
      setSettings(data.settings ?? null);
      if (!data.settings) {
        throw new Error("Could not load settings.");
      }
    } catch (error) {
      setSettings(null);
      setLoadError(error instanceof Error ? error.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings, reloadToken]);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);

    try {
      const response = await fetch("/api/settings/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        toast.error(await readApiError(response, "Failed to save settings."));
        return;
      }

      toast.success("Settings saved.");
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    try {
      const response = await fetch("/api/export");
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not export your data."));
        return;
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `observolife-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded.");
    } catch {
      toast.error("Could not export your data.");
    }
  }

  async function deleteAccount() {
    setDeleting(true);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not delete your account."));
        return;
      }

      window.location.href = "/login";
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-card h-80 skeleton" />
        <div className="surface-card h-44 skeleton" />
      </div>
    );
  }

  if (loadError || !settings) {
    return (
      <div className="surface-card space-y-4 border-destructive/25 bg-destructive/5 p-4 sm:p-7">
        <p className="text-sm text-destructive">{loadError ?? "Could not load settings."}</p>
        <Button variant="outline" onClick={() => setReloadToken((token) => token + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAiSettings ? (
      <section className="surface-card space-y-4 p-4 sm:space-y-5 sm:p-7">
        <div>
          <h2 className="section-title">AI insights schedule</h2>
          <p className="section-subtitle">
            Minimum days between manual AI insight runs when you tap &quot;AI insights&quot; on your feed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interval">Analysis interval (days)</Label>
          <Input
            id="interval"
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            enterKeyHint="done"
            className="h-11 text-base sm:text-sm"
            value={settings.analysisIntervalDays}
            onChange={(e) =>
              setSettings({
                ...settings,
                analysisIntervalDays: Number(e.target.value),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            7 = weekly, 30 = monthly. Enforced on the server when you generate insights.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="anchor">Preferred day (weekly)</Label>
          <Select
            value={settings.analysisAnchorDay}
            onValueChange={(value) =>
              setSettings({ ...settings, analysisAnchorDay: value ?? "sunday" })
            }
          >
            <SelectTrigger id="anchor" className="h-11 w-full text-base sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(
                (day) => (
                  <SelectItem key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            type="text"
            inputMode="text"
            enterKeyHint="done"
            className="h-11 text-base sm:text-sm"
            value={settings.timezone}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          />
        </div>

        <Button
          onClick={saveSettings}
          disabled={saving}
          className="h-11 w-full touch-manipulation sm:w-auto"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save settings"}
        </Button>
      </section>
      ) : null}

      <section className="surface-card space-y-4 p-4 sm:p-7">
        <div>
          <h2 className="section-title">Your data</h2>
          <p className="section-subtitle">
            Export everything or permanently delete your account.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <Button
            variant="outline"
            onClick={exportData}
            className="h-auto min-h-11 w-full touch-manipulation whitespace-normal px-4 py-3 sm:flex-1"
          >
            Export all events (JSON)
          </Button>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  className="h-auto min-h-11 w-full touch-manipulation whitespace-normal px-4 py-3 sm:flex-1"
                >
                  Delete account
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes your account, events, insights, and all other data.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  render={
                    <Button variant="outline" className="sm:w-auto">
                      Cancel
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="sm:w-auto"
                  disabled={deleting}
                  onClick={() => void deleteAccount()}
                >
                  {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete account"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}
