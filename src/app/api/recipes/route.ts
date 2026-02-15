import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const recipes = await prisma.recipe.findMany({
    include: {
      ingredients: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(recipes);
}
