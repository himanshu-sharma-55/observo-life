import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth/session";
import { exportUserData } from "@/lib/events/service";

export async function GET() {
  try {
    const userId = await requireUserId();
    const data = await exportUserData(userId);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
