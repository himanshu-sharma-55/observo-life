import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 hidden flex-col gap-3 md:mb-7 md:flex md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.025em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-[0.9375rem] leading-relaxed text-muted-foreground md:max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
