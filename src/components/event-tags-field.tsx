"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, Plus, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  loadRecentEventTags,
  MAX_EVENT_TAGS,
  normalizeTagInput,
  normalizeTags,
} from "@/lib/events/tags";
import { mobileFieldTextClass } from "@/lib/ui/mobile-field";
import { cn } from "@/lib/utils";

type EventTagsFieldProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
};

async function fetchEventTags(query: string): Promise<string[]> {
  const params = new URLSearchParams({ limit: "20" });
  if (query) params.set("q", query);

  const response = await fetch(`/api/events/tags?${params.toString()}`);
  if (!response.ok) return loadRecentEventTags();

  const data = (await response.json()) as { tags?: string[] };
  return normalizeTags(data.tags);
}

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

const DROPDOWN_MAX_HEIGHT = 208;

function getDropdownPosition(anchor: HTMLElement): DropdownPosition {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const openAbove = spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > DROPDOWN_MAX_HEIGHT;

  return {
    top: openAbove ? rect.top - DROPDOWN_MAX_HEIGHT - 4 : rect.bottom + 4,
    left: rect.left,
    width: rect.width,
  };
}

export function EventTagsField({ value, onChange, className }: EventTagsFieldProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);

  const atLimit = value.length >= MAX_EVENT_TAGS;
  const normalizedQuery = normalizeTagInput(query);

  const loadSuggestions = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const remote = await fetchEventTags(search);
      const merged = normalizeTags([...remote, ...loadRecentEventTags()]);
      setSuggestions(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      void loadSuggestions(query);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadSuggestions, open, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest(`[data-event-tags-listbox="${listboxId}"]`)) {
          setOpen(false);
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [listboxId]);

  const updateDropdownPosition = useCallback(() => {
    if (!anchorRef.current) return;
    setDropdownPosition(getDropdownPosition(anchorRef.current));
  }, []);

  const availableSuggestions = useMemo(
    () => suggestions.filter((tag) => !value.includes(tag)),
    [suggestions, value],
  );

  const canCreate =
    !atLimit &&
    normalizedQuery.length > 0 &&
    !value.includes(normalizedQuery) &&
    !availableSuggestions.includes(normalizedQuery);

  const options = useMemo(() => {
    const items: Array<{ type: "create" | "tag"; tag: string }> = [];
    if (canCreate) items.push({ type: "create", tag: normalizedQuery });
    for (const tag of availableSuggestions) {
      items.push({ type: "tag", tag });
    }
    return items;
  }, [availableSuggestions, canCreate, normalizedQuery]);

  useEffect(() => {
    if (!open) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition, options.length, query, value.length]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [options.length, query]);

  const showDropdown = open && !atLimit && (options.length > 0 || loading);

  const dropdown =
    showDropdown && dropdownPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            id={listboxId}
            role="listbox"
            data-event-tags-listbox={listboxId}
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 200,
            }}
            className="max-h-52 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-soft-lg)]"
          >
            {loading && options.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">Loading tags…</p>
            ) : (
              options.map((option, index) => {
                const highlighted = index === highlightIndex;
                const isCreate = option.type === "create";

                return (
                  <button
                    key={`${option.type}-${option.tag}`}
                    type="button"
                    role="option"
                    aria-selected={highlighted}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      highlighted ? "bg-muted text-foreground" : "text-foreground/90 hover:bg-muted/70",
                    )}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(index)}
                  >
                    {isCreate ? (
                      <Plus className="size-3.5 shrink-0 text-primary" />
                    ) : (
                      <Check className="size-3.5 shrink-0 text-transparent" />
                    )}
                    <span className="min-w-0 truncate">
                      {isCreate ? (
                        <>
                          Add <span className="font-medium">&ldquo;{option.tag}&rdquo;</span>
                        </>
                      ) : (
                        option.tag
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  function addTag(raw: string) {
    const tag = normalizeTagInput(raw);
    if (!tag || value.includes(tag) || value.length >= MAX_EVENT_TAGS) return;

    onChange([...value, tag]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
    inputRef.current?.focus();
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    addTag(option.tag);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (open && options.length > 0) {
        selectOption(highlightIndex);
      } else if (normalizedQuery) {
        addTag(normalizedQuery);
      }
      return;
    }

    if (event.key === "Backspace" && !query && value.length > 0) {
      onChange(value.slice(0, -1));
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
  }

  return (
    <div ref={rootRef} className={cn("relative space-y-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <Tag className="mt-2.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div
            ref={anchorRef}
            className={cn(
              "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 transition-colors",
              open && "ring-2 ring-ring/45",
              atLimit && "opacity-90",
            )}
            onPointerDown={(event) => {
              if (atLimit) return;
              if (event.target instanceof HTMLElement && event.target.closest("input,button")) return;
              setOpen(true);
              inputRef.current?.focus();
            }}
          >
            {value.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-6 gap-1 rounded-full pr-1 pl-2 font-normal"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeTag(tag);
                  }}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}

            {!atLimit && (
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-autocomplete="list"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder={value.length === 0 ? "Search or add tags…" : "Add another…"}
                autoComplete="off"
                enterKeyHint="done"
                className={cn(
                  "min-h-8 min-w-[7rem] w-full flex-1 bg-transparent px-1 py-1 outline-none placeholder:text-muted-foreground/70",
                  mobileFieldTextClass,
                )}
              />
            )}
          </div>

          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {atLimit
              ? `${MAX_EVENT_TAGS} tags max`
              : "Type to search · Enter to add · Backspace removes last"}
          </p>
        </div>
      </div>

      {dropdown}
    </div>
  );
}
