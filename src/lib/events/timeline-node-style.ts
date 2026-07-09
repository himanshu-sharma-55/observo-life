import type { EventLogKind } from "@/lib/events/log-kind";

export function timelineNodeStyle(logKind: EventLogKind) {
  if (logKind === "day") {
    return {
      timeClass: "text-primary",
      dotClass: "bg-primary",
    };
  }

  return {
    timeClass: "text-[color:var(--timeline-moment)]",
    dotClass: "bg-[color:var(--timeline-moment)]",
  };
}
