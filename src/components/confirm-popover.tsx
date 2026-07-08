"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmPopoverProps = {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmPopover({
  trigger,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  side = "top",
  align = "end",
  className,
  onConfirm,
}: ConfirmPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger render={trigger} />
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          side={side}
          align={align}
          sideOffset={8}
          className="isolate z-50 outline-none"
        >
          <PopoverPrimitive.Popup
            className={cn(
              "w-56 rounded-xl border border-border bg-popover p-3 shadow-[var(--shadow-soft-lg)] outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              className,
            )}
          >
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            ) : null}

            <div className="mt-3 flex items-center justify-end gap-2">
              <PopoverPrimitive.Close
                render={
                  <Button type="button" variant="ghost" size="xs" disabled={pending}>
                    {cancelLabel}
                  </Button>
                }
              />
              <Button
                type="button"
                variant="destructive"
                size="xs"
                disabled={pending}
                onClick={() => void handleConfirm()}
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : confirmLabel}
              </Button>
            </div>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
