import { cn } from "@/lib/utils";

type EventTextProps = {
  children: string;
  className?: string;
  as?: "p" | "div";
};

export function EventText({ children, className, as: Tag = "p" }: EventTextProps) {
  return (
    <Tag
      className={cn(
        "whitespace-pre-wrap text-base leading-[1.65] text-foreground sm:text-[0.9375rem] sm:leading-relaxed",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
