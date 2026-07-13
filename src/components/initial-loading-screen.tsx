import { AuthBackdrop } from "@/components/auth-backdrop";
import { BrandIcon } from "@/components/brand-icon";

export function InitialLoadingScreen() {
  return (
    <div
      className="relative flex h-svh w-full items-center justify-center overflow-hidden bg-[#0a101c]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Observolife"
    >
      <AuthBackdrop />

      <div
        className="pointer-events-none absolute -left-[14%] top-[18%] h-[44%] w-[54%] rounded-full opacity-35 blur-3xl motion-safe:animate-[ai-aura-drift_18s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(109, 181, 166, 0.5) 0%, rgba(109, 181, 166, 0) 72%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-[12%] bottom-[14%] h-[40%] w-[50%] rounded-full opacity-30 blur-3xl motion-safe:animate-[ai-aura-drift-alt_22s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle, rgba(120, 168, 198, 0.45) 0%, rgba(120, 168, 198, 0) 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="relative mb-7">
          <span
            className="absolute inset-0 m-auto size-28 rounded-full motion-safe:animate-[ai-persona-ring_2.4s_ease-in-out_infinite]"
            style={{
              background:
                "radial-gradient(circle, rgba(109, 181, 166, 0.35) 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative motion-safe:animate-[ai-persona-float_3.2s_ease-in-out_infinite]">
            <BrandIcon variant="tile" size={80} />
          </div>
        </div>

        <p className="text-[0.6875rem] font-semibold tracking-[0.2em] text-[#8fd4c8] uppercase">
          Observolife
        </p>
        <p className="mt-2 text-base font-medium tracking-tight text-white/90">
          Observe your life
        </p>

        <div className="mt-6 flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-1.5 rounded-full bg-[#6db5a6]/80 motion-safe:animate-[ai-thinking-dot_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${dot * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
