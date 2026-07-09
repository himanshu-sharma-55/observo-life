import { AppShell } from "@/components/app-shell";
import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import { PageHeader } from "@/components/page-header";
import dynamic from "next/dynamic";

const SearchForm = dynamic(
  () => import("@/components/search-form").then((mod) => mod.SearchForm),
  { loading: () => <PanelSkeleton /> },
);

export default function SearchPage() {
  return (
    <AppShell>
      <PageHeader
        title="Search your life"
        description="Find events by keyword, date, or spending. Your recorded reality — searchable in seconds."
      />
      <SearchForm />
    </AppShell>
  );
}
