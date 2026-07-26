import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth-shell";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { deferPasswordSetup, logoutUser, setPassword } from "@/lib/auth/actions";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/db/models";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const errorMessages: Record<string, string> = {
  short: "Password must be at least 8 characters.",
  mismatch: "Passwords do not match.",
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("passwordHash email").lean();

  if (!user) {
    redirect("/login");
  }

  if (user.passwordHash) {
    redirect("/feed");
  }

  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <AuthShell
      title="Set a password"
      subtitle={`Add a password for ${user.email ?? "your account"} so you can also sign in with email. You can skip and set it later in Settings.`}
    >
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form action={setPassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            enterKeyHint="next"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            enterKeyHint="done"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-11"
          />
        </div>
        <AuthSubmitButton label="Save password" pendingLabel="Saving…" />
      </form>

      <form action={deferPasswordSetup} className="mt-3">
        <Button type="submit" variant="outline" className="h-11 w-full">
          Skip for now
        </Button>
      </form>

      <form action={logoutUser} className="mt-4">
        <Button type="submit" variant="ghost" className="w-full text-muted-foreground">
          Sign out
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Back to home
        </Link>
      </p>
    </AuthShell>
  );
}
