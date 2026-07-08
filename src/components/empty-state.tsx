import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  className?: string;
  compact?: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  compact = false,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 px-6 text-center",
        compact ? "py-8" : "py-10 md:py-12",
        className,
      )}
    >
      <div className="mb-3.5 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
        <p className="text-[0.8125rem] font-medium text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {action.label}
            </Link>
          ) : (
            <Button size="sm" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
