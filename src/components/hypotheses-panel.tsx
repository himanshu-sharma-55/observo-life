"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import { ConfirmPopover } from "@/components/confirm-popover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Hypothesis = {
  id: string;
  statement: string;
};

export function HypothesesPanel() {
  const [items, setItems] = useState<Hypothesis[]>([]);
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadError(null);

    try {
      const response = await fetch("/api/hypotheses");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load beliefs."));
      }

      const data = await response.json();
      setItems(data.hypotheses ?? []);
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof Error ? error.message : "Could not load beliefs.");
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
      const response = await fetch("/api/hypotheses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response, "Could not add belief."));
        return;
      }

      setStatement("");
      await load();
      toast.success("Belief added.");
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHypothesis(id: string) {
    try {
      const response = await fetch(`/api/hypotheses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not delete belief."));
        return;
      }

      await load();
      toast.success("Belief deleted.");
    } catch {
      toast.error("Could not reach the server.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="surface-card h-64 skeleton" />
        <div className="surface-card h-28 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface-card p-4 sm:p-7">
        <div className="mb-4 md:mb-5">
          <h2 className="section-title">Add a belief</h2>
          <p className="section-subtitle">
            Something you suspect is true — write it plainly. AI insights use your
            words when you include beliefs.
          </p>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hypothesis">What do you believe?</Label>
            <Textarea
              id="hypothesis"
              placeholder="Late coffee makes it harder to fall asleep"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={3}
              enterKeyHint="done"
              required
            />
          </div>
          <Button type="submit" disabled={saving || !statement.trim()} className="w-full touch-manipulation sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Add belief"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Your beliefs</h2>
          <p className="section-subtitle">
            Recorded for reference. Generate AI insights from the feed to reflect on them.
          </p>
        </div>

        {loadError && (
          <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {items.length === 0 ? (
          !loadError ? (
          <EmptyState
            compact
            icon={FlaskConical}
            title="No beliefs yet"
            description="Add assumptions you want to check against your life events. AI insights can reflect on them when you ask."
          />
          ) : null
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="surface-card-interactive animate-in-up group flex items-start justify-between gap-3 p-5"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
              >
                <p className="text-[0.9375rem] leading-relaxed">{item.statement}</p>
                <ConfirmPopover
                  title="Delete this belief?"
                  description="It will be removed from your list."
                  onConfirm={() => deleteHypothesis(item.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete belief"
                      className="opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
