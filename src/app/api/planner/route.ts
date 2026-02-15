import { NextResponse } from "next/server";
import { plannerService } from "@/lib/services/planner.service";
import { plannerInputSchema } from "@/lib/validation/schemas";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const userId = await requireUser(req);
    const body = await req.json();
    const parsed = plannerInputSchema.safeParse({ ...body, userId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const plan = await plannerService.generate(parsed.data);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate plan" },
      { status: 400 }
    );
  }
}
