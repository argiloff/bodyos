import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || "demo@bodyos.local";
  const password = process.env.SEED_PASSWORD || "Passw0rd!";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      profile: {
        create: {
          weight: 75,
          height: 180,
          age: 30,
          activityLevel: "moderate",
          calorieTarget: 2000,
          proteinTarget: 140,
          goalWeight: 72,
          excludedProducts: [],
        },
      },
    },
    include: { profile: true },
  });

  console.log("Seeded user:", { email, password });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
