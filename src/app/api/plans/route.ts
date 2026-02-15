import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const userId = await requireUser();
  const plans = await prisma.plan.findMany({
    where: { userId },
    include: { meals: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(plans);
}
