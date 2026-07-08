import { AppShell } from "@/components/app-shell";
import { EventTimeline } from "@/components/event-timeline";
import { PageHeader } from "@/components/page-header";

export default function EventsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Your events"
        description="The source of truth for everything Observolife observes. Raw, editable, and always yours."
      />
      <EventTimeline />
    </AppShell>
  );
}
