export function EventTimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="surface-card overflow-hidden">
          <div className="border-b border-border/80 bg-muted/20 px-4 py-3">
            <div className="skeleton h-4 w-36 rounded-full" />
          </div>
          <div className="space-y-5 px-4 py-5">
            {[0, 1, 2].map((j) => (
              <div key={j} className="flex gap-4">
                <div className="skeleton h-3 w-10 rounded-full" />
                <div className="skeleton size-2.5 rounded-full" />
                <div className="skeleton h-16 min-w-0 flex-1 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border/70 bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex gap-3">
            <div className="skeleton size-10 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-24 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventComposerSkeleton() {
  return (
    <div className="surface-card mb-6 overflow-hidden">
      <div className="space-y-3 p-4">
        <div className="skeleton h-24 w-full rounded-lg" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-full" />
          <div className="skeleton h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="border-t border-border px-4 py-3">
        <div className="skeleton ml-auto h-11 w-28 rounded-full sm:h-8" />
      </div>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="surface-card space-y-4 p-5 sm:p-7">
      <div className="skeleton h-10 w-full rounded-lg" />
      <div className="skeleton h-32 w-full rounded-lg" />
      <div className="skeleton h-10 w-32 rounded-lg" />
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface-card p-5">
          <div className="skeleton mb-3 h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-4/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}
