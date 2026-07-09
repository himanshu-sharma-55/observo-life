import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { isAiEnabledForUser } from "@/lib/ai/access";
import dynamic from "next/dynamic";

const SettingsForm = dynamic(
  () => import("@/components/settings-form").then((mod) => mod.SettingsForm),
  { loading: () => <PanelSkeleton /> },
);

export default async function SettingsPage() {
  const session = await auth();
  const showAiSettings = isAiEnabledForUser(session?.user?.email, isAiConfigured());

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Your preferences, analysis schedule, and data — all under your control."
      />
      <SettingsForm showAiSettings={showAiSettings} />
    </AppShell>
  );
}
