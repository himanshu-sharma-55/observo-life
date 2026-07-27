import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function GoogleAuth({
  label,
  showDivider = true,
  className,
}: {
  label: string;
  showDivider?: boolean;
  className?: string;
}) {
  // Same gate as the Google provider in auth/index.ts (server env, not NEXT_PUBLIC).
  const googleConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim(),
  );

  if (!googleConfigured) {
    return (
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Google sign-in is not configured. Add{" "}
        <code className="text-xs">AUTH_GOOGLE_ID</code> and{" "}
        <code className="text-xs">AUTH_GOOGLE_SECRET</code> in your environment, then redeploy.
      </p>
    );
  }

  return (
    <div className={cn(className)}>
      {showDivider ? (
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      <form action={loginWithGoogle}>
        <Button type="submit" variant="outline" size="lg" className="h-11 w-full gap-2.5">
          <GoogleIcon />
          {label}
        </Button>
      </form>
    </div>
  );
}
