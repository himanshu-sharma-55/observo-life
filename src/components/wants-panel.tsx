"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Compass } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import { ConfirmPopover } from "@/components/confirm-popover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Want = {
  id: string;
  title: string;
  description: string | null;
};

export function WantsPanel() {
  const [wants, setWants] = useState<Want[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadError(null);

    try {
      const response = await fetch("/api/wants");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load wants."));
      }

      const data = await response.json();
      setWants(data.wants ?? []);
    } catch (error) {
      setWants([]);
      setLoadError(error instanceof Error ? error.message : "Could not load wants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/wants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response, "Could not add want."));
        return;
      }

      setTitle("");
      setDescription("");
      await load();
      toast.success("Want added.");
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWant(id: string) {
    try {
      const response = await fetch(`/api/wants/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not delete want."));
        return;
      }

      await load();
      toast.success("Want deleted.");
    } catch {
      toast.error("Could not reach the server.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-card h-72 skeleton" />
        <div className="surface-card h-24 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface-card p-4 sm:p-7">
        <div className="mb-4 md:mb-5">
          <h2 className="section-title">Add a want</h2>
          <p className="section-subtitle">
            A direction you&apos;re moving toward — not a checkpoint. Say it in your
            own words; AI insights use the title and description when you include wants.
          </p>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="want-title">Direction</Label>
            <Input
              id="want-title"
              type="text"
              inputMode="text"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="Better sleep"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="want-desc">Description (optional)</Label>
            <Textarea
              id="want-desc"
              placeholder="What this means to you — e.g. wind down earlier, fewer late screens"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              enterKeyHint="done"
            />
          </div>
          <Button type="submit" disabled={saving || !title.trim()} className="w-full touch-manipulation sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Add want"}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="section-title">Your wants</h2>

        {loadError && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {wants.length === 0 ? (
          !loadError ? (
          <EmptyState
            compact
            icon={Compass}
            title="No wants yet"
            description="Wants are directions you're moving toward — not goals with deadlines. Add your first one above."
          />
          ) : null
        ) : (
          wants.map((want, index) => (
            <article
              key={want.id}
              className="surface-card-interactive animate-in-up group flex items-start justify-between gap-3 p-5"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              <div className="space-y-2">
                <p className="font-medium">{want.title}</p>
                {want.description && (
                  <p className="text-sm text-muted-foreground">{want.description}</p>
                )}
              </div>
              <ConfirmPopover
                title="Delete this want?"
                description="It will be removed from your list."
                onConfirm={() => deleteWant(want.id)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete want"
                    className="opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
