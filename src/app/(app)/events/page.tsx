import { AppShell } from "@/components/app-shell";
import { EventTimelineSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import dynamic from "next/dynamic";

const EventTimeline = dynamic(
  () => import("@/components/event-timeline").then((mod) => mod.EventTimeline),
  { loading: () => <EventTimelineSkeleton /> },
);

export default function EventsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Your events"
        description="The source of truth for everything Observolife observes — grouped by day, in timeline order."
      />
      <EventTimeline />
    </AppShell>
  );
}
