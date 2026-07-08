import {
  ActivitySquare,
  CalendarClock,
  LineChart,
  Sparkles,
  TrendingUpDown,
  type LucideIcon,
} from "lucide-react";

export type FeedInsightTypeStyle = {
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  wash: string;
  ring: string;
  tag: string;
  takeawayAccent: string;
};

export const feedInsightTypeStyles: Record<string, FeedInsightTypeStyle> = {
  observation: {
    label: "Observation",
    icon: Sparkles,
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
    wash: "from-sky-500/[0.07] to-transparent",
    ring: "ring-sky-500/20",
    tag: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    takeawayAccent: "border-sky-500/30 bg-sky-500/[0.06]",
  },
  interesting: {
    label: "Interesting",
    icon: ActivitySquare,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    wash: "from-violet-500/[0.07] to-transparent",
    ring: "ring-violet-500/20",
    tag: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    takeawayAccent: "border-violet-500/30 bg-violet-500/[0.06]",
  },
  change_detected: {
    label: "Change",
    icon: TrendingUpDown,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
    wash: "from-amber-500/[0.08] to-transparent",
    ring: "ring-amber-500/20",
    tag: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    takeawayAccent: "border-amber-500/30 bg-amber-500/[0.06]",
  },
  pattern: {
    label: "Pattern",
    icon: LineChart,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    wash: "from-emerald-500/[0.07] to-transparent",
    ring: "ring-emerald-500/20",
    tag: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    takeawayAccent: "border-emerald-500/30 bg-emerald-500/[0.06]",
  },
  timeline: {
    label: "Timeline",
    icon: CalendarClock,
    iconBg: "bg-slate-500/15",
    iconColor: "text-slate-600 dark:text-slate-400",
    wash: "from-slate-500/[0.07] to-transparent",
    ring: "ring-slate-500/20",
    tag: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    takeawayAccent: "border-slate-500/30 bg-slate-500/[0.06]",
  },
};

export const feedInsightFallbackStyle: FeedInsightTypeStyle = {
  label: "Insight",
  icon: Sparkles,
  iconBg: "bg-primary/10",
  iconColor: "text-primary",
  wash: "from-primary/[0.06] to-transparent",
  ring: "ring-primary/20",
  tag: "bg-muted text-foreground",
  takeawayAccent: "border-primary/25 bg-primary/[0.05]",
};

export function getFeedInsightTypeStyle(type: string) {
  return feedInsightTypeStyles[type] ?? feedInsightFallbackStyle;
}
