import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import dynamic from "next/dynamic";

const ActivitiesPanel = dynamic(
  () => import("@/components/activities-panel").then((mod) => mod.ActivitiesPanel),
  { loading: () => <PanelSkeleton /> },
);

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
