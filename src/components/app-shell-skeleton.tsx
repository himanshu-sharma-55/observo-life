import {
  EventComposerSkeleton,
  FeedListSkeleton,
} from "@/components/lazy-loading-skeletons";

export function AppShellSkeleton({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-svh w-full overflow-hidden bg-canvas">
      <aside className="hidden w-[16.5rem] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="skeleton size-[2.125rem] rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-24 rounded-full" />
            <div className="skeleton h-3 w-32 rounded-full" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 px-3 py-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-9 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3 border-t border-border p-3">
          <div className="skeleton h-8 rounded-lg" />
          <div className="skeleton h-10 rounded-lg" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/90 px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="skeleton size-[1.625rem] rounded-lg" />
            <div className="skeleton h-4 w-24 rounded-full" />
          </div>
          <div className="flex gap-2">
            <div className="skeleton size-8 rounded-full" />
            <div className="skeleton size-8 rounded-full" />
          </div>
        </header>

        <main className="mobile-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="w-full px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:pb-8">
            {children ?? (
              <div className="space-y-6">
                <div className="skeleton h-24 rounded-2xl md:hidden" />
                <EventComposerSkeleton />
                <div className="skeleton h-9 w-48 rounded-lg" />
                <FeedListSkeleton />
              </div>
            )}
          </div>
        </main>

        <nav className="shrink-0 px-5 pt-1 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="mobile-floating-nav mx-auto grid max-w-[17.5rem] grid-cols-4 gap-1 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton mx-auto h-10 w-full max-w-[4.5rem] rounded-xl" />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
