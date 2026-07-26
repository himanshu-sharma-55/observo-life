"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/db/models";
import { auth, signIn } from "@/lib/auth";

export async function loginUser(formData: FormData) {
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/feed",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  // Always land on the router: asks for password only when missing.
  await signIn("google", { redirectTo: "/auth/continue" });
}

export async function setPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  const password = formData.get("password")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";

  if (password.length < 8) {
    redirect("/set-password?error=short");
  }

  if (password !== confirm) {
    redirect("/set-password?error=mismatch");
  }

  await connectToDatabase();

  const user = await User.findById(session.user.id).select("passwordHash email").lean();
  if (!user) {
    redirect("/login");
  }

  if (user.passwordHash) {
    redirect("/feed");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { _id: session.user.id },
    { $set: { passwordHash, passwordSetupDeferred: false } },
  );

  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo: "/feed",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

/** Skip setting a password for now; can set it later in Settings. */
export async function deferPasswordSetup() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  await User.updateOne(
    { _id: session.user.id },
    { $set: { passwordSetupDeferred: true } },
  );

  redirect("/feed");
}

export async function logoutUser() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/" });
}
