import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { GoogleAuth } from "@/components/google-auth";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Start observing"
      subtitle="Create your account with Google. Your email is verified automatically."
    >
      <GoogleAuth label="Continue with Google" showDivider={false} />

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
