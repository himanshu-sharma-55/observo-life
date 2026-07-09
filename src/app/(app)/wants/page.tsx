import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import dynamic from "next/dynamic";

const WantsPanel = dynamic(
  () => import("@/components/wants-panel").then((mod) => mod.WantsPanel),
  { loading: () => <PanelSkeleton /> },
);

export default function WantsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Wants"
        description="Directions, not goals. Record what you're moving toward — AI insights can reflect on them later."
      />
      <WantsPanel />
    </AppShell>
  );
}
