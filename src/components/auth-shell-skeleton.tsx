export function AuthShellSkeleton() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <div className="relative hidden w-[44%] bg-[#121f35] lg:block" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="skeleton mx-auto h-8 w-40 rounded-full lg:mx-0" />
            <div className="skeleton mx-auto h-4 w-56 rounded-full lg:mx-0" />
          </div>
          <div className="surface-card space-y-4 p-6">
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
