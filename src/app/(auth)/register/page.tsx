import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { GoogleAuth } from "@/components/google-auth";
import { registerUser } from "@/lib/auth/actions";

const errorMessages: Record<string, string> = {
  invalid: "Email and password (min 8 characters) are required.",
  exists: "An account with this email already exists.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <AuthShell
      title="Start observing"
      subtitle="Create your personal evidence engine in under a minute."
    >
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={registerUser} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            inputMode="text"
            enterKeyHint="next"
            autoComplete="name"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            enterKeyHint="next"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            enterKeyHint="done"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <AuthSubmitButton label="Create account" pendingLabel="Creating account…" />
      </form>

      <GoogleAuth label="Sign up with Google" />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
