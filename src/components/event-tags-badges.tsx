"use client";

import { normalizeTags } from "@/lib/events/tags";
import { tagChipClass } from "@/lib/events/tag-style";
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
            className={cn(tagChipClass(tag, true), "touch-manipulation")}
          >
            #{tag}
          </button>
        ) : (
          <span key={tag} className={tagChipClass(tag)}>
            #{tag}
          </span>
        ),
      )}
    </div>
  );
}
