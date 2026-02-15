import { NextResponse } from "next/server";
import { groceryService } from "@/lib/services/grocery.service";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const userId = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    if (!start || !end) {
      return NextResponse.json({ error: "start and end required" }, { status: 400 });
    }
    const list = await groceryService.listForRange(userId, new Date(start), new Date(end));
    return NextResponse.json(list);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to generate grocery list" }, { status: 500 });
  }
}
