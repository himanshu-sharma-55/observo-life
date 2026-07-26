"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AiCreditsInfo = {
  unlimited: boolean;
  credits: number | null;
  buyCreditsMailto: string;
};

export function openBuyCreditsEmail(mailto: string) {
  window.location.href = mailto;
}

export function AiCreditsLabel({
  info,
  className,
}: {
  info: AiCreditsInfo | null;
  className?: string;
}) {
  if (!info) return null;

  if (info.unlimited) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>Unlimited AI credits</p>
    );
  }

  const remaining = info.credits ?? 0;
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {remaining === 1 ? "1 AI credit left" : `${remaining} AI credits left`}
      {remaining === 0 ? " · free trial used" : ""}
    </p>
  );
}

export function BuyCreditsButton({
  mailto,
  className,
  variant = "outline",
  size = "sm",
}: {
  mailto: string;
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost" | "destructive" | "link";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-1.5", className)}
      onClick={() => openBuyCreditsEmail(mailto)}
    >
      <Mail className="size-3.5" />
      Get more credits
    </Button>
  );
}
