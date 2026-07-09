import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import dynamic from "next/dynamic";

const HypothesesPanel = dynamic(
  () => import("@/components/hypotheses-panel").then((mod) => mod.HypothesesPanel),
  { loading: () => <PanelSkeleton /> },
);

export default function HypothesesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Beliefs"
        description="Personal hypotheses you want to keep an eye on. Recorded here, assessed only when you generate AI insights."
      />
      <HypothesesPanel />
    </AppShell>
  );
}
