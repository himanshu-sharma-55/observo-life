import { AppShell } from "@/components/app-shell";
import { ActivitiesPanel } from "@/components/activities-panel";
import { PageHeader } from "@/components/page-header";

export default function ActivitiesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Activities"
        description="Saved shortcuts for things you log often. Pick them when writing events, day logs, or past entries."
      />
      <ActivitiesPanel />
    </AppShell>
  );
}
