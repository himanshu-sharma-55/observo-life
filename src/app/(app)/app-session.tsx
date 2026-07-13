import { SessionUserProvider } from "@/components/session-user-provider";
import { getSessionUser } from "@/lib/auth/session";

export async function AppSession({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }
    : null;

  return <SessionUserProvider user={user}>{children}</SessionUserProvider>;
}
