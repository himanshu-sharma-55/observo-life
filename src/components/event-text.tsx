import { cn } from "@/lib/utils";

type EventTextProps = {
  children: string;
  className?: string;
  as?: "p" | "div";
};

export function EventText({ children, className, as: Tag = "p" }: EventTextProps) {
  return <Tag className={cn("whitespace-pre-wrap", className)}>{children}</Tag>;
}
