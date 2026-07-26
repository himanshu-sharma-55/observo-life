import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/db/models";
import { requireUserId } from "@/lib/auth/session";
import { auth } from "@/lib/auth";

const bodySchema = z
  .object({
    currentPassword: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

export async function GET() {
  try {
    const userId = await requireUserId();
    await connectToDatabase();
    const user = await User.findById(userId).select("passwordHash email").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      email: user.email,
      hasPassword: Boolean(user.passwordHash),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to load password status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid password details.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userId).select("passwordHash email").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.passwordHash) {
      const current = parsed.data.currentPassword ?? "";
      if (!current) {
        return NextResponse.json(
          { error: "Enter your current password to change it." },
          { status: 400 },
        );
      }
      const valid = await bcrypt.compare(current, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await User.updateOne(
      { _id: userId },
      { $set: { passwordHash, passwordSetupDeferred: false } },
    );

    return NextResponse.json({
      ok: true,
      hasPassword: true,
      created: !user.passwordHash,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
