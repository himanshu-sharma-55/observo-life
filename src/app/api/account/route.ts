import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/events/service";

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await deleteUserAccount(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
