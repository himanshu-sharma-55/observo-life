"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EventComposer } from "@/components/event-composer";
import { FeedList } from "@/components/feed-list";
import { FeedInsightPreview } from "@/components/feed-insight-preview";
import { OnboardingHint } from "@/components/onboarding-hint";
import { RecapHero } from "@/components/recap-hero";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { readApiError } from "@/lib/api/client";
import {
  AI_FEED_OPTIONS_STORAGE_KEY,
  DEFAULT_AI_FEED_OPTIONS,
  type AiFeedOptions,
} from "@/lib/feed/ai-options";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "observolife.onboarding.dismissed";

type FeedScope = "current" | "overall";

type EligibleRecap = {
  month: string;
  label: string;
  eventCount?: number;
  generated: boolean;
};

type AiOptionKey = keyof AiFeedOptions;

const AI_OPTION_GROUPS: {
  title: string;
  description: string;
  options: { key: AiOptionKey; label: string; hint: string }[];
}[] = [
  {
    title: "Insight types",
    description: "Choose which feed layers to generate.",
    options: [
      {
        key: "includeCurrent",
        label: "Current week",
        hint: "What changed this week vs last week.",
      },
      {
        key: "includeOverall",
        label: "Overall patterns",
        hint: "Multi-week trends and recurring signals.",
      },
    ],
  },
  {
    title: "Also consider",
    description: "Optional context from your lists.",
    options: [
      {
        key: "includeWants",
        label: "Your wants",
        hint: "Surface alignment or tension with stated wants.",
      },
      {
        key: "includeBeliefs",
        label: "Your beliefs",
        hint: "Note whether events support or touch your beliefs.",
      },
    ],
  },
];

function loadStoredAiOptions(): AiFeedOptions {
  try {
    const raw = localStorage.getItem(AI_FEED_OPTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_FEED_OPTIONS;
    const parsed = JSON.parse(raw) as Partial<AiFeedOptions>;
    return {
      includeCurrent: parsed.includeCurrent ?? DEFAULT_AI_FEED_OPTIONS.includeCurrent,
      includeOverall: parsed.includeOverall ?? DEFAULT_AI_FEED_OPTIONS.includeOverall,
      includeWants: parsed.includeWants ?? DEFAULT_AI_FEED_OPTIONS.includeWants,
      includeBeliefs: parsed.includeBeliefs ?? DEFAULT_AI_FEED_OPTIONS.includeBeliefs,
    };
  } catch {
    return DEFAULT_AI_FEED_OPTIONS;
  }
}

function persistAiOptions(options: AiFeedOptions) {
  try {
    localStorage.setItem(AI_FEED_OPTIONS_STORAGE_KEY, JSON.stringify(options));
  } catch {
    // ignore
  }
}

export function FeedHome({ aiEnabled }: { aiEnabled: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [scope, setScope] = useState<FeedScope>("current");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eligibleRecap, setEligibleRecap] = useState<EligibleRecap | null>(null);
  const [aiOptions, setAiOptions] = useState<AiFeedOptions>(DEFAULT_AI_FEED_OPTIONS);

  const canGenerate = aiOptions.includeCurrent || aiOptions.includeOverall;

  const loadEligible = useCallback(async () => {
    try {
      const response = await fetch("/api/recap/eligible");
      if (!response.ok) return;
      const data = await response.json();
      setEligibleRecap(data.eligible ?? null);
    } catch {
      setEligibleRecap(null);
    }
  }, []);

  async function generateInsights() {
    if (!canGenerate) {
      toast.error("Select at least one insight type.");
      return;
    }

    persistAiOptions(aiOptions);
    setConfirmOpen(false);
    setGenerating(true);
    try {
      const response = await fetch("/api/feed/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: aiOptions }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(await readApiError(response, "Could not generate insights."));
        return;
      }

      const current = data.currentInserted ?? 0;
      const overall = data.overallInserted ?? 0;
      const total = current + overall;
      if (total === 0) {
        toast("No new insights this time — keep logging.");
      } else {
        const parts: string[] = [];
        if (aiOptions.includeCurrent) parts.push(`${current} current`);
        if (aiOptions.includeOverall) parts.push(`${overall} overall`);
        toast.success(`Added ${parts.join(" + ")} insights.`);
      }
      setRefreshKey((key) => key + 1);
    } catch {
      toast.error("Could not reach the AI service.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleAiOption(key: AiOptionKey) {
    setAiOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  function openConfirmDialog() {
    setAiOptions(loadStoredAiOptions());
    setConfirmOpen(true);
  }

  useEffect(() => {
    try {
      setShowOnboarding(localStorage.getItem(ONBOARDING_KEY) !== "true");
    } catch {
      setShowOnboarding(false);
    }
    void loadEligible();
  }, [loadEligible]);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // ignore
    }
  }

  return (
    <>
      {showOnboarding && <OnboardingHint onDismiss={dismissOnboarding} />}

      <RecapHero
        eligible={eligibleRecap}
        aiEnabled={aiEnabled}
        onGenerated={() => {
          void loadEligible();
        }}
      />

      <EventComposer
        onLogged={() => {
          setRefreshKey((key) => key + 1);
          dismissOnboarding();
          void loadEligible();
        }}
      />

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-0.5 sm:w-auto">
            {(["current", "overall"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setScope(tab)}
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-xs font-semibold capitalize transition-colors sm:flex-none sm:py-1.5",
                  scope === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="h-px min-w-0 flex-1 bg-border max-sm:hidden" />
          {aiEnabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openConfirmDialog}
            disabled={generating}
            className="w-full touch-manipulation gap-1.5 sm:ml-auto sm:w-auto"
          >
            {generating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {generating ? "Thinking…" : "AI insights"}
          </Button>
          ) : null}
        </div>
        <FeedList refreshKey={refreshKey} scope={scope} />
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-h-[min(90vh,720px)] max-w-lg overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Generate AI insights?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose what to include. Insights are specific and forward-leaning — even quiet weeks
              get framed with gentle direction. This runs only when you ask.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {AI_OPTION_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{group.title}</p>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
                <div className="space-y-2">
                  {group.options.map((option) => {
                    const checked = aiOptions[option.key];
                    const inputId = `ai-option-${option.key}`;

                    return (
                      <label
                        key={option.key}
                        htmlFor={inputId}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border bg-card hover:bg-muted/30",
                        )}
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAiOption(option.key)}
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 space-y-0.5">
                          <span className="block text-sm font-medium leading-none">
                            {option.label}
                          </span>
                          <span className="block text-xs leading-relaxed text-muted-foreground">
                            {option.hint}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!canGenerate ? (
            <p className="text-xs text-destructive">Select at least one insight type.</p>
          ) : null}

          <div className="rounded-xl border border-border/80 bg-muted/15 p-4">
            <FeedInsightPreview
              scope={
                aiOptions.includeCurrent && !aiOptions.includeOverall
                  ? "current"
                  : aiOptions.includeOverall && !aiOptions.includeCurrent
                    ? "overall"
                    : scope
              }
              compact
            />
          </div>

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
              className="gap-1.5 sm:w-auto"
              disabled={!canGenerate}
              onClick={() => void generateInsights()}
            >
              <Sparkles className="size-3.5" />
              Generate insights
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
