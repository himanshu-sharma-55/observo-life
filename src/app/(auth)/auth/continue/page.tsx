import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/db/models";

/**
 * Post-auth router used after Google sign-in.
 * No password → ask to set one. Password exists → go to the app.
 */
export default async function AuthContinuePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id).select("passwordHash").lean();

  if (!user) {
    redirect("/login");
  }

  if (user.passwordHash) {
    redirect("/feed");
  }

  redirect("/set-password");
}
