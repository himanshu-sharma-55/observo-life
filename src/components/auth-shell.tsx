import Link from "next/link";
import { AuthBackdrop } from "@/components/auth-backdrop";
import { BrandIcon } from "@/components/brand-icon";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      <div className="relative hidden w-[44%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <AuthBackdrop />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3.5">
            <BrandIcon variant="tile" size={48} />
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Observolife</p>
              <p className="text-sm text-white/65">Observe your life</p>
            </div>
          </div>

          <div className="max-w-md space-y-6">
            <h2 className="text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.04em] text-balance">
              The obvious patterns you&apos;re too close to see.
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-white/65">
              A calm, evidence-first space to log what happened and discover what your life
              is quietly showing you.
            </p>
          </div>

          <p className="text-sm text-white/40">No judgment. No prescriptions. Just observation.</p>
        </div>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-y-auto overscroll-contain px-4 py-8 sm:items-center sm:px-8 sm:py-10 mobile-scroll-padding">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -8%, rgba(90, 154, 143, 0.09), transparent 58%), radial-gradient(ellipse 60% 45% at 100% 100%, rgba(30, 45, 74, 0.06), transparent 55%), linear-gradient(180deg, #faf9f7 0%, #f3f0eb 48%, #ebe6df 100%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0.5px,transparent_0.5px)] [background-size:24px_24px]" />

        <div className="relative z-10 w-full max-w-[420px] py-2">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex items-center gap-3">
              <BrandIcon variant="tile" size={42} />
              <div>
                <p className="text-sm font-semibold tracking-[-0.02em]">Observolife</p>
                <p className="text-xs text-muted-foreground">Observe your life</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/85 p-8 shadow-[0_8px_32px_rgba(30,45,74,0.08),0_2px_8px_rgba(30,45,74,0.04)] backdrop-blur-sm sm:p-10 dark:border-border dark:bg-card/90">
            <div className="mb-8 space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h1>
              <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground lg:hidden">
            <Link href="/" className="transition-colors hover:text-foreground">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
