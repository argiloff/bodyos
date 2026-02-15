import { NextResponse } from "next/server";
import { profileService } from "@/lib/services/profile.service";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const userId = await requireUser();
    const profile = await profileService.get(userId);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
    }
    const updated = await profileService.upsert(userId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
