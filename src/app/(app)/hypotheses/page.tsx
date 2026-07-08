import { AppShell } from "@/components/app-shell";
import { HypothesesPanel } from "@/components/hypotheses-panel";
import { PageHeader } from "@/components/page-header";

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
