import { AppShell } from "@/components/app-shell";
import { SearchForm } from "@/components/search-form";
import { PageHeader } from "@/components/page-header";

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
