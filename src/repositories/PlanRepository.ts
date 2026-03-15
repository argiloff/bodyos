import { getDatabase } from '../db/schema';
import type { Plan, PlanMeal, PlanWithMeals, PlanInsert, MealType } from '../types';
import { uid } from '../types';

// ─── Read ─────────────────────────────────────────────────────

export async function getAllPlans(): Promise<PlanWithMeals[]> {
  const db = await getDatabase();
  const plans = await db.getAllAsync<Plan>(
    'SELECT * FROM plans ORDER BY created_at DESC'
  );
  const allMeals = await db.getAllAsync<PlanMeal>(
    'SELECT * FROM plan_meals ORDER BY date, meal_type'
  );

  const mealsByPlan: Record<string, PlanMeal[]> = {};
  for (const meal of allMeals) {
    if (!mealsByPlan[meal.plan_id]) mealsByPlan[meal.plan_id] = [];
    mealsByPlan[meal.plan_id].push(meal);
  }

  return plans.map(p => ({
    ...p,
    meals: mealsByPlan[p.id] ?? [],
  }));
}

export async function getPlanById(id: string): Promise<PlanWithMeals | null> {
  const db = await getDatabase();
  const plan = await db.getFirstAsync<Plan>(
    'SELECT * FROM plans WHERE id = ?', id
  );
  if (!plan) return null;

  const meals = await db.getAllAsync<PlanMeal>(
    'SELECT * FROM plan_meals WHERE plan_id = ? ORDER BY date, meal_type',
    id
  );

  return { ...plan, meals };
}

export async function getPlanCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM plans');
  return row?.count ?? 0;
}

// ─── Write ────────────────────────────────────────────────────

export async function createPlan(
  plan: PlanInsert,
  meals: { date: string; meal_type: MealType; recipe_id: string }[]
): Promise<PlanWithMeals> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const planId = plan.id || uid('plan');

  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync(
      `INSERT INTO plans (id, start_date, end_date, calorie_target, protein_target, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      planId, plan.start_date, plan.end_date, plan.calorie_target, plan.protein_target, now
    );

    for (const meal of meals) {
      await db.runAsync(
        'INSERT INTO plan_meals (id, plan_id, date, meal_type, recipe_id) VALUES (?, ?, ?, ?, ?)',
        uid('pm'), planId, meal.date, meal.meal_type, meal.recipe_id
      );
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return (await getPlanById(planId))!;
}

export async function deletePlan(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM plans WHERE id = ?', id);
}
