"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
  TextQuote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AiCreditsLabel,
  BuyCreditsButton,
  openBuyCreditsEmail,
  type AiCreditsInfo,
} from "@/components/ai-credits";
import { EventTagsBadges } from "@/components/event-tags-badges";
import { EventText } from "@/components/event-text";
import { Button } from "@/components/ui/button";
import { readApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type EvidenceEvent = {
  id: string;
  text: string;
  occurredAt: string;
  tags: string[];
  amount?: string | null;
  logKind?: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestion?: string | null;
  evidence?: EvidenceEvent[];
  question?: string;
  savedId?: string | null;
  saving?: boolean;
};

type SavedNote = {
  id: string;
  question: string;
  answer: string;
  suggestion: string;
  evidence: EvidenceEvent[];
  createdAt: string;
};

const SUGGESTIONS = [
  "What patterns show up in my evenings?",
  "When was I most stressed lately?",
  "What should I notice this week?",
  "How do my walks relate to my mood?",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LifeGptChat({ aiEnabled }: { aiEnabled: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [aiCredits, setAiCredits] = useState<AiCreditsInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const outOfCredits =
    aiCredits !== null && !aiCredits.unlimited && (aiCredits.credits ?? 0) <= 0;

  const loadAiCredits = useCallback(async () => {
    if (!aiEnabled) {
      setAiCredits(null);
      return;
    }
    try {
      const response = await fetch("/api/ai/status");
      if (!response.ok) return;
      const data = (await response.json()) as {
        unlimited?: boolean;
        credits?: number | null;
        buyCreditsMailto?: string;
      };
      setAiCredits({
        unlimited: Boolean(data.unlimited),
        credits: data.unlimited ? null : (data.credits ?? 0),
        buyCreditsMailto: data.buyCreditsMailto ?? "",
      });
    } catch {
      // ignore
    }
  }, [aiEnabled]);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch("/api/lifegpt/saved");
      if (!response.ok) return;
      const data = (await response.json()) as { saved?: SavedNote[] };
      setSavedNotes(data.saved ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    void loadAiCredits();
    void loadSaved();
  }, [loadAiCredits, loadSaved]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function saveMessage(message: ChatMessage) {
    if (message.role !== "assistant" || message.savedId || message.saving) return;
    const question = message.question?.trim();
    const suggestion = message.suggestion?.trim();
    if (!question || !suggestion) {
      toast.error("Nothing to save yet.");
      return;
    }

    setMessages((current) =>
      current.map((item) => (item.id === message.id ? { ...item, saving: true } : item)),
    );

    try {
      const response = await fetch("/api/lifegpt/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer: message.content,
          suggestion,
          evidence: (message.evidence ?? []).map((event) => ({
            id: event.id,
            text: event.text,
            occurredAt: event.occurredAt,
            tags: event.tags ?? [],
          })),
        }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not save for reference."));
      }
      const data = (await response.json()) as { saved?: SavedNote };
      if (data.saved) {
        setSavedNotes((current) => [data.saved!, ...current]);
        setMessages((current) =>
          current.map((item) =>
            item.id === message.id
              ? { ...item, savedId: data.saved!.id, saving: false }
              : item,
          ),
        );
        toast.success("Saved for your reference.");
      }
    } catch (error) {
      setMessages((current) =>
        current.map((item) => (item.id === message.id ? { ...item, saving: false } : item)),
      );
      toast.error(error instanceof Error ? error.message : "Could not save.");
    }
  }

  async function deleteSaved(id: string) {
    try {
      const response = await fetch(`/api/lifegpt/saved/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not remove saved note."));
      }
      setSavedNotes((current) => current.filter((note) => note.id !== id));
      setMessages((current) =>
        current.map((item) => (item.savedId === id ? { ...item, savedId: null } : item)),
      );
      toast.success("Removed from saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove.");
    }
  }

  async function sendMessage(raw: string) {
    const message = raw.trim();
    if (!message || sending) return;

    if (!aiEnabled) {
      toast.error("AI is not configured yet.");
      return;
    }

    if (outOfCredits && aiCredits?.buyCreditsMailto) {
      openBuyCreditsEmail(aiCredits.buyCreditsMailto);
      return;
    }

    const userMessage: ChatMessage = { id: newId(), role: "user", content: message };
    const history = [...messages, userMessage]
      .slice(-6)
      .map((item) => ({ role: item.role, content: item.content }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/lifegpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(0, -1),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        answer?: string;
        suggestion?: string | null;
        evidence?: EvidenceEvent[];
        credits?: { unlimited?: boolean; remaining?: number | null };
      };

      if (!response.ok) {
        if (data.code === "ai_credits" && aiCredits?.buyCreditsMailto) {
          toast.error(data.error?.trim() || "Out of AI credits.", {
            action: {
              label: "Get more",
              onClick: () => openBuyCreditsEmail(aiCredits.buyCreditsMailto),
            },
          });
          void loadAiCredits();
          return;
        }
        throw new Error(data.error?.trim() || (await readApiError(response, "LifeGPT failed.")));
      }

      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          question: message,
          content: data.answer?.trim() || "I could not form an answer from your logs.",
          suggestion:
            data.suggestion?.trim() ||
            "Keep logging a few more days — clearer patterns will give me more to work with.",
          evidence: data.evidence ?? [],
          savedId: null,
        },
      ]);

      if (data.credits) {
        setAiCredits((current) =>
          current
            ? {
                ...current,
                unlimited: Boolean(data.credits?.unlimited),
                credits: data.credits?.unlimited ? null : (data.credits?.remaining ?? 0),
              }
            : current,
        );
      } else {
        void loadAiCredits();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "LifeGPT failed.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await sendMessage(input);
  }

  if (!aiEnabled) {
    return (
      <div className="surface-card p-5 text-sm text-muted-foreground sm:p-7">
        LifeGPT needs AI configured. Add a Gemini API key to enable chat over your logs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex min-h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Sparkles className="size-3.5 text-primary" />
              LifeGPT
            </p>
            <p className="text-xs text-muted-foreground">
              Answers from your logs, plus suggestions
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <AiCreditsLabel info={aiCredits} />
            <div className="flex items-center gap-2">
              {messages.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setMessages([])}
                >
                  New chat
                </Button>
              ) : null}
              {outOfCredits && aiCredits?.buyCreditsMailto ? (
                <BuyCreditsButton mailto={aiCredits.buyCreditsMailto} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {messages.length === 0 ? (
            <div className="space-y-4 py-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ask anything about your life. Save useful replies for later — New chat only clears
                this thread, not your saved notes.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending || outOfCredits}
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted/60 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[min(100%,36rem)] rounded-2xl px-3.5 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground shadow-[var(--shadow-soft)]",
                )}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-3">
                    {message.suggestion ? (
                      <div className="rounded-xl border border-primary/25 bg-primary/8 px-3.5 py-3.5">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-[0.14em] text-primary uppercase">
                            <Sparkles className="size-3" />
                            LifeGPT says
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            disabled={Boolean(message.savedId) || message.saving}
                            onClick={() => void saveMessage(message)}
                          >
                            {message.saving ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : message.savedId ? (
                              <BookmarkCheck className="size-3.5 text-primary" />
                            ) : (
                              <Bookmark className="size-3.5" />
                            )}
                            {message.savedId ? "Saved" : "Save"}
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-foreground">
                          {message.suggestion}
                        </p>
                      </div>
                    ) : null}

                    <div className="overflow-hidden rounded-xl border border-border/90 bg-gradient-to-br from-muted/40 via-background to-background">
                      <div className="flex items-center gap-2 border-b border-border/70 px-3.5 py-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-foreground/5 text-foreground/70">
                          <TextQuote className="size-3.5" />
                        </span>
                        <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-foreground/70 uppercase">
                          What your logs show
                        </p>
                      </div>
                      <div className="border-l-[3px] border-l-foreground/15 px-3.5 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-[1.65] text-foreground/90">
                          {message.content}
                        </p>
                      </div>
                    </div>

                    {message.evidence && message.evidence.length > 0 ? (
                      <details className="group rounded-xl border border-dashed border-border/90 bg-muted/15 open:border-solid open:bg-muted/25">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                          <span className="inline-flex items-center gap-1.5">
                            Source events
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] tabular-nums text-foreground/70">
                              {message.evidence.length}
                            </span>
                          </span>
                          <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="space-y-2 border-t border-border/70 px-3 py-2.5">
                          {message.evidence.slice(0, 5).map((event) => (
                            <div
                              key={event.id}
                              className="rounded-lg border border-border/60 bg-background/90 px-2.5 py-2"
                            >
                              <p className="text-[0.7rem] text-muted-foreground">
                                {format(new Date(event.occurredAt), "MMM d, yyyy · h:mm a")}
                              </p>
                              <EventText className="mt-0.5 text-xs text-foreground">
                                {event.text}
                              </EventText>
                              {event.tags?.length ? (
                                <div className="mt-1.5">
                                  <EventTagsBadges tags={event.tags} />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Reading your logs…
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={2}
              placeholder={
                outOfCredits ? "Get more credits to keep asking…" : "Ask LifeGPT about your life…"
              }
              disabled={sending || outOfCredits}
              className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || outOfCredits || !input.trim()}
              className="size-11 shrink-0"
              aria-label="Send"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </form>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Saved for reference</h2>
            <p className="text-xs text-muted-foreground">
              Kept even if you clear the chat or leave the page.
            </p>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] tabular-nums text-muted-foreground">
            {savedNotes.length}
          </span>
        </div>

        {loadingSaved ? (
          <p className="text-sm text-muted-foreground">Loading saved notes…</p>
        ) : savedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tap Save on a LifeGPT reply to keep it here.
          </p>
        ) : (
          <div className="space-y-3">
            {savedNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-xl border border-border/80 bg-muted/15 p-3.5 sm:p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
                      You asked
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{note.question}</p>
                    <p className="mt-1 text-[0.7rem] text-muted-foreground">
                      {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove saved note"
                    onClick={() => void deleteSaved(note.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <p className="mb-1 text-[0.65rem] font-semibold tracking-[0.12em] text-primary uppercase">
                    LifeGPT says
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {note.suggestion}
                  </p>
                </div>
                <details className="group mt-2">
                  <summary className="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-1">
                      What your logs showed
                      <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                    {note.answer}
                  </p>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
