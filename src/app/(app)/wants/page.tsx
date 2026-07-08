import { AppShell } from "@/components/app-shell";
import { WantsPanel } from "@/components/wants-panel";
import { PageHeader } from "@/components/page-header";

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
