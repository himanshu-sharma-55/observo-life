import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import { auth } from "@/lib/auth";
import { isAiConfigured } from "@/lib/ai/client";
import { isAiEnabledForUser } from "@/lib/ai/access";
import dynamic from "next/dynamic";

const LifeGptChat = dynamic(
  () => import("@/components/lifegpt-chat").then((mod) => mod.LifeGptChat),
  { loading: () => <PanelSkeleton /> },
);

const SearchForm = dynamic(
  () => import("@/components/search-form").then((mod) => mod.SearchForm),
  { loading: () => <PanelSkeleton /> },
);

export default async function SearchPage() {
  const session = await auth();
  const aiEnabled = isAiEnabledForUser(session?.user?.email, isAiConfigured());

  return (
    <AppShell>
      <PageHeader
        title="LifeGPT"
        description="Ask about your life. Answers come from your logs first, with room for suggestions on top."
      />
      <div className="space-y-8">
        <LifeGptChat aiEnabled={aiEnabled} />
        <details className="group rounded-2xl border border-border bg-card open:pb-2">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground sm:px-5">
            Browse events by keyword
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              classic search
            </span>
          </summary>
          <div className="border-t border-border px-4 py-4 sm:px-5">
            <SearchForm />
          </div>
        </details>
      </div>
    </AppShell>
  );
}
