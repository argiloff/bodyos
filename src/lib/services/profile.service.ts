import { prisma } from "../db";

export const profileService = {
  async get(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  },
  async upsert(userId: string, data: Partial<{
    weight: number;
    height: number;
    age: number;
    activityLevel: string;
    calorieTarget: number;
    proteinTarget: number;
    goalWeight: number;
    excludedProducts: string[];
  }>) {
    return prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data, excludedProducts: data.excludedProducts ?? [] },
    });
  },
};
