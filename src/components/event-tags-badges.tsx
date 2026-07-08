"use client";

import { Badge } from "@/components/ui/badge";
import { normalizeTags } from "@/lib/events/tags";
import { cn } from "@/lib/utils";

type EventTagsBadgesProps = {
  tags: string[] | undefined | null;
  onTagClick?: (tag: string) => void;
  className?: string;
};

export function EventTagsBadges({ tags, onTagClick, className }: EventTagsBadgesProps) {
  const items = normalizeTags(tags);
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((tag) =>
        onTagClick ? (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            className="inline-flex h-[1.375rem] items-center rounded-md border border-transparent bg-secondary px-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            #{tag}
          </button>
        ) : (
          <Badge key={tag} variant="secondary" className="font-normal">
            #{tag}
          </Badge>
        ),
      )}
    </div>
  );
}
