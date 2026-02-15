import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const userId = await requireUser();
    const plans = await prisma.plan.findMany({
      where: { userId },
      include: { meals: true },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
