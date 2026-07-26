import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function HomePage() {
  const session = await auth();

  return <LandingPage isLoggedIn={Boolean(session?.user)} />;
}
