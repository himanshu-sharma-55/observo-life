"use client";

import { useEffect, useState } from "react";
import { Bookmark, Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { readApiError } from "@/lib/api/client";
import type { SerializedSavedActivity } from "@/lib/activities/service";
import { activityLogText } from "@/lib/activities/format";
import { ConfirmPopover } from "@/components/confirm-popover";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventTagsField } from "@/components/event-tags-field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ActivitiesPanel() {
  const [activities, setActivities] = useState<SerializedSavedActivity[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoadError(null);

    try {
      const response = await fetch("/api/activities");
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not load activities."));
      }

      const data = await response.json();
      setActivities(data.activities ?? []);
    } catch (error) {
      setActivities([]);
      setLoadError(error instanceof Error ? error.message : "Could not load activities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, tags }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response, "Could not save activity."));
        return;
      }

      setTitle("");
      setText("");
      setTags([]);
      await load();
      toast.success("Activity saved.");
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteActivity(id: string) {
    try {
      const response = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readApiError(response, "Could not delete activity."));
        return;
      }

      if (editingId === id) cancelEdit();
      await load();
      toast.success("Activity deleted.");
    } catch {
      toast.error("Could not reach the server.");
    }
  }

  function startEdit(activity: SerializedSavedActivity) {
    setEditingId(activity.id);
    setEditTitle(activity.title);
    setEditText(activity.text ?? "");
    setEditTags(activity.tags ?? []);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditText("");
    setEditTags([]);
  }

  async function saveEdit(id: string) {
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;

    setSavingId(id);
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          text: editText,
          tags: editTags,
        }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response, "Could not update activity."));
        return;
      }

      const data = await response.json();
      setActivities((current) =>
        current.map((activity) => (activity.id === id ? data.activity : activity)),
      );
      toast.success("Activity updated.");
      cancelEdit();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSavingId(null);
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
    <div className="space-y-6">
      <section className="surface-card p-4 sm:p-7">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <h2 className="section-title">Save an activity</h2>
            <p className="section-subtitle">
              Shortcuts for things you log often — breakfast, gym, commute, and the like.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-title">Name</Label>
            <Input
              id="activity-title"
              type="text"
              inputMode="text"
              enterKeyHint="next"
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Breakfast"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-text">What to log (optional)</Label>
            <Textarea
              id="activity-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Oats, coffee, fruit — leave blank to use the name"
              rows={2}
              enterKeyHint="done"
            />
          </div>

          <EventTagsField value={tags} onChange={setTags} />

          <Button type="submit" disabled={saving || !title.trim()} className="w-full sm:w-auto">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Save activity"}
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        {loadError ? (
          <div className="surface-card border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        {activities.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved activities yet"
            description="Save routines you log often. They'll show up when you compose events on the feed."
            action={{ label: "Go to feed", href: "/feed" }}
          />
        ) : (
          activities.map((activity, index) => {
            const isEditing = editingId === activity.id;
            const isSaving = savingId === activity.id;

            return (
            <article
              key={activity.id}
              className="surface-card-interactive animate-in-up group flex items-start justify-between gap-3 p-5"
              style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
            >
              {isEditing ? (
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-title-${activity.id}`}>Name</Label>
                    <Input
                      id={`edit-title-${activity.id}`}
                      type="text"
                      inputMode="text"
                      enterKeyHint="next"
                      autoComplete="off"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-11"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-text-${activity.id}`}>What to log</Label>
                    <Textarea
                      id={`edit-text-${activity.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      enterKeyHint="done"
                    />
                  </div>
                  <EventTagsField value={editTags} onChange={setEditTags} />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(activity.id)}
                      disabled={isSaving || !editTitle.trim()}
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
              <div className="min-w-0 space-y-2">
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activityLogText(activity)}</p>
                <EventTagsBadges tags={activity.tags} />
              </div>
              <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit activity"
                  className="hover:bg-muted hover:text-foreground"
                  onClick={() => startEdit(activity)}
                >
                  <Pencil className="size-4" />
                </Button>
              <ConfirmPopover
                title="Delete this activity?"
                description="It will be removed from your saved list."
                onConfirm={() => deleteActivity(activity.id)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete activity"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
              </div>
                </>
              )}
            </article>
            );
          })
        )}
      </section>
    </div>
  );
}
