"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  BuyCreditsButton,
  openBuyCreditsEmail,
  type AiCreditsInfo,
} from "@/components/ai-credits";
import { AiThinkingOverlay } from "@/components/ai-thinking-overlay";
import { Button } from "@/components/ui/button";

const RECAP_MESSAGES = [
  "Reviewing your month…",
  "Finding rhythms and surprises…",
  "Shaping your month story…",
  "Almost ready…",
];

type EligibleRecap = {
  month: string;
  label: string;
  eventCount?: number;
  generated: boolean;
};

export function RecapHero({
  eligible,
  aiEnabled,
  aiCredits,
  onGenerated,
}: {
  eligible: EligibleRecap | null;
  aiEnabled: boolean;
  aiCredits?: AiCreditsInfo | null;
  onGenerated?: () => void;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  if (!eligible || !aiEnabled) return null;

  const outOfCredits =
    !eligible.generated &&
    aiCredits !== null &&
    aiCredits !== undefined &&
    !aiCredits.unlimited &&
    (aiCredits.credits ?? 0) <= 0;

  async function handleAction() {
    if (eligible!.generated) {
      router.push(`/recap/${eligible!.month}`);
      return;
    }

    if (outOfCredits && aiCredits?.buyCreditsMailto) {
      openBuyCreditsEmail(aiCredits.buyCreditsMailto);
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/recap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: eligible!.month }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        if (data.code === "ai_credits" && aiCredits?.buyCreditsMailto) {
          toast.error(data.error?.trim() || "Out of AI credits.", {
            action: {
              label: "Get more",
              onClick: () => openBuyCreditsEmail(aiCredits.buyCreditsMailto),
            },
          });
          onGenerated?.();
          return;
        }
        toast.error(data.error?.trim() || "Could not generate month insights.");
        return;
      }

      toast.success(`${eligible!.label} recap is ready.`);
      onGenerated?.();
      router.push(`/recap/${eligible!.month}`);
    } catch {
      toast.error("Could not reach the AI service.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <AiThinkingOverlay open={generating} messages={RECAP_MESSAGES} />

      <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-4 shadow-[var(--shadow-soft)] md:mb-6 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary md:size-11 md:rounded-xl">
            <CalendarHeart className="size-4 md:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {eligible.generated
                ? `View your ${eligible.label} recap`
                : `${eligible.label} is complete`}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground md:text-sm">
              {eligible.generated
                ? "Your month insights are ready to explore."
                : outOfCredits
                  ? "You need an AI credit to generate this month recap."
                  : `Get month insights — stats and patterns you might have missed${
                      eligible.eventCount ? ` (${eligible.eventCount} events)` : ""
                    }.`}
            </p>
            {outOfCredits && aiCredits?.buyCreditsMailto ? (
              <BuyCreditsButton mailto={aiCredits.buyCreditsMailto} className="mt-3" />
            ) : (
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleAction}
                disabled={generating}
              >
                <Sparkles className="size-3.5" />
                {eligible.generated ? "View recap" : "Get month insights"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
