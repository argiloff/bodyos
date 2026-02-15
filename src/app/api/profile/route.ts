import { NextResponse } from "next/server";
import { profileService } from "@/lib/services/profile.service";
import { requireUser } from "@/lib/auth/session";

export async function GET() {
  const userId = await requireUser();
  const profile = await profileService.get(userId);
  return NextResponse.json(profile);
}

export async function POST(req: Request) {
  const userId = await requireUser();
  const data = await req.json();
  const updated = await profileService.upsert(userId, data);
  return NextResponse.json(updated);
}
