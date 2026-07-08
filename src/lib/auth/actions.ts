"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { User, UserSettings } from "@/lib/db/models";
import { signIn } from "@/lib/auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name")?.toString().trim() || null;
  const email = formData.get("email")?.toString().toLowerCase().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password || password.length < 8) {
    redirect("/register?error=invalid");
  }

  await connectToDatabase();

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    redirect("/register?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({ name, email, passwordHash });
  await UserSettings.create({ userId: String(user._id) });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
}

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
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function logoutUser() {
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/login" });
}
