import { AppShell } from "@/components/app-shell";
import { FeedHome } from "@/components/feed-home";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { isAiEnabledForUser } from "@/lib/ai/access";

export default async function FeedPage() {
  const session = await auth();
  const aiEnabled = isAiEnabledForUser(session?.user?.email, isAiConfigured());

  return (
    <AppShell>
      <FeedHome aiEnabled={aiEnabled} />
    </AppShell>
  );
}
