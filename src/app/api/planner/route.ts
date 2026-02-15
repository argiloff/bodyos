import { NextResponse } from "next/server";
import { plannerService } from "@/lib/services/planner.service";
import { plannerInputSchema } from "@/lib/validation/schemas";
import { requireUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  const userId = await requireUser();
  const body = await req.json();
  const parsed = plannerInputSchema.safeParse({ ...body, userId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }
  const plan = await plannerService.generate(parsed.data);
  return NextResponse.json(plan);
}
