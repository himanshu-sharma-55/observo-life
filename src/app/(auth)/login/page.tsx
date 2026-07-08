import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuth } from "@/components/google-auth";
import { loginUser } from "@/lib/auth/actions";

const errorMessages: Record<string, string> = {
  invalid: "Invalid email or password.",
  missing: "Email and password are required.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue observing the patterns in your life."
    >
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={loginUser} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" inputMode="email" enterKeyHint="next" required autoComplete="email" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            enterKeyHint="done"
            required
            autoComplete="current-password"
            className="h-11"
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>

      <GoogleAuth label="Continue with Google" />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
