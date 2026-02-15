import { NextResponse } from "next/server";
import { groceryService } from "@/lib/services/grocery.service";
import { requireUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  const userId = await requireUser();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }
  const list = await groceryService.listForRange(userId, new Date(start), new Date(end));
  return NextResponse.json(list);
}
