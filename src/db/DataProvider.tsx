import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Product,
  Recipe,
  RecipeWithDetails,
  RecipeIngredient,
  RecipeStep,
  Plan,
  PlanWithMeals,
  PlanMeal,
  Profile,
  GroceryItem,
  Macros,
  MealType,
  ImportPayload,
  ImportProduct,
  ImportRecipe,
  ProductSubstitute,
} from '../types';
import { MEAL_TYPES, uid, slugify, computeMacros } from '../types';
import * as ProductRepo from '../repositories/ProductRepository';
import * as RecipeRepo from '../repositories/RecipeRepository';
import * as PlanRepo from '../repositories/PlanRepository';
import { getDatabase, getSetting, setSetting, resetData, resetAll } from '../db/schema';
import { normalizeIngredientKey } from '../utils/helpers';

// ─── Legacy AsyncStorage keys (for migration) ────────────────
const LEGACY_STORE_KEY = 'bodyos_store_v1';
const LEGACY_SESSION_KEY = 'bodyos_session_v1';
const MIGRATION_DONE_KEY = 'migration_v2_done';
const PROFILE_KEY = 'profile';

// ─── Context Value ────────────────────────────────────────────
type DataContextValue = {
  // State
  loading: boolean;
  products: Product[];
  recipes: RecipeWithDetails[];
  plans: PlanWithMeals[];
  profile: Profile;
  substitutes: ProductSubstitute[];

  // Products
  upsertProduct: (product: Omit<Product, 'created_at' | 'updated_at'>, substituteIds?: string[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Recipes
  upsertRecipe: (
    recipe: { id?: string; name: string; description: string; meal_type: MealType; tags: string[] },
    ingredients: { product_id: string; amount_g: number }[],
    steps: { instruction: string; image_uri?: string }[]
  ) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;

  // Plans
  generatePlan: (input: {
    startDate: string;
    endDate: string;
    calorieTarget: number;
    proteinTarget: number;
  }) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  getPlanById: (id: string) => PlanWithMeals | null;

  // Grocery
  getGroceryList: (planId: string) => GroceryItem[];

  // Recipe resolution (substitution)
  getResolvedRecipe: (recipeId: string) => RecipeWithDetails | null;

  // Macros
  getRecipeMacros: (recipeId: string) => Macros;

  // Profile
  updateProfile: (patch: Partial<Profile>) => Promise<void>;

  // Import / Export
  importJson: (payload: ImportPayload) => Promise<{ products: number; recipes: number }>;
  exportJson: () => Promise<string>;

  // Reset
  clearData: () => Promise<void>;
  clearAll: () => Promise<void>;

  // Reload
  reload: () => Promise<void>;
};

const defaultProfile: Profile = {
  calorie_target: 2000,
  protein_target: 140,
  excluded_product_ids: [],
};

const DataContext = createContext<DataContextValue | null>(null);

// ─── Migration from AsyncStorage ──────────────────────────────
async function migrateFromAsyncStorage(): Promise<boolean> {
  try {
    const done = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
    if (done === 'true') return false;

    const raw = await AsyncStorage.getItem(LEGACY_STORE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
      return false;
    }

    const store = JSON.parse(raw) as {
      products?: any[];
      recipes?: any[];
      plans?: any[];
      profiles?: any[];
    };

    // Migrate products
    if (store.products?.length) {
      const substitutesMap: Record<string, string[]> = {};
      const products = store.products.map((p: any) => {
        if (p.allowed_substitutes?.length) {
          substitutesMap[p.id] = p.allowed_substitutes;
        }
        return {
          id: p.id,
          name: p.name || '',
          category: p.category || '',
          image_uri: p.imageUri || p.image_uri || undefined,
          kcal_per_100g: p.kcal_per_100g || 0,
          protein_per_100g: p.protein_per_100g || 0,
          fat_per_100g: p.fat_per_100g || 0,
          carbs_per_100g: p.carbs_per_100g || 0,
          fiber_per_100g: p.fiber_per_100g || 0,
        };
      });
      await ProductRepo.bulkUpsertProducts(products, substitutesMap);
    }

    // Migrate recipes
    if (store.recipes?.length) {
      const recipes = store.recipes.map((r: any) => ({
        id: r.id,
        name: r.name || '',
        description: r.description || '',
        meal_type: r.mealType || r.meal_type || 'lunch',
        tags: r.tags || [],
        ingredients: (r.ingredients || []).map((ing: any) => ({
          product_id: ing.productId || ing.product_id || '',
          amount_g: ing.amount_g || 0,
        })),
        steps: (r.instructions || []).map((text: string, i: number) => ({
          instruction: text,
          image_uri: r.stepImageUris?.[i] || undefined,
        })),
      }));
      await RecipeRepo.bulkUpsertRecipes(recipes);
    }

    // Migrate plans
    if (store.plans?.length) {
      for (const plan of store.plans) {
        try {
          await PlanRepo.createPlan(
            {
              id: plan.id,
              start_date: plan.startDate || plan.start_date,
              end_date: plan.endDate || plan.end_date,
              calorie_target: plan.calorieTarget || plan.calorie_target || 2000,
              protein_target: plan.proteinTarget || plan.protein_target || 140,
            },
            (plan.meals || []).map((m: any) => ({
              date: m.date,
              meal_type: m.mealType || m.meal_type,
              recipe_id: m.recipeId || m.recipe_id,
            }))
          );
        } catch {
          // Skip plans that fail (e.g. missing recipe references)
        }
      }
    }

    // Migrate profile
    if (store.profiles?.length) {
      const p = store.profiles[0];
      const profile: Profile = {
        calorie_target: p.calorieTarget || p.calorie_target || 2000,
        protein_target: p.proteinTarget || p.protein_target || 140,
        excluded_product_ids: p.excludedProducts || p.excluded_product_ids || [],
      };
      await setSetting(PROFILE_KEY, JSON.stringify(profile));
    }

    await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
    return true;
  } catch (e) {
    console.warn('[Migration] Error migrating from AsyncStorage:', e);
    return false;
  }
}

// ─── Provider ─────────────────────────────────────────────────
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [plans, setPlans] = useState<PlanWithMeals[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [substitutes, setSubstitutes] = useState<ProductSubstitute[]>([]);

  // ── Load all data ───────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      // Ensure DB is initialized
      await getDatabase();

      // Run migration on first load
      await migrateFromAsyncStorage();

      // Load everything in parallel
      const [prods, recs, plns, subs, profileRaw] = await Promise.all([
        ProductRepo.getAllProducts(),
        RecipeRepo.getAllRecipesWithDetails(),
        PlanRepo.getAllPlans(),
        ProductRepo.getAllSubstitutes(),
        getSetting(PROFILE_KEY),
      ]);

      setProducts(prods);
      setRecipes(recs);
      setPlans(plns);
      setSubstitutes(subs);

      if (profileRaw) {
        try {
          setProfile({ ...defaultProfile, ...JSON.parse(profileRaw) });
        } catch {
          setProfile(defaultProfile);
        }
      }
    } catch (e) {
      console.error('[DataProvider] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // ── Build lookup maps ───────────────────────────────────────
  const productsById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, Product>,
    [products]
  );

  const recipesById = useMemo(
    () => Object.fromEntries(recipes.map((r) => [r.id, r])) as Record<string, RecipeWithDetails>,
    [recipes]
  );

  const substitutesByProduct = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const s of substitutes) {
      if (!map[s.product_id]) map[s.product_id] = [];
      map[s.product_id].push(s.substitute_id);
    }
    return map;
  }, [substitutes]);

  const excluded = useMemo(
    () => new Set(profile.excluded_product_ids),
    [profile.excluded_product_ids]
  );

  // ── Recipe substitution ─────────────────────────────────────
  const resolveRecipe = useCallback(
    (recipe: RecipeWithDetails): RecipeWithDetails | null => {
      const resolvedIngredients: RecipeIngredient[] = [];
      for (const ing of recipe.ingredients) {
        if (!excluded.has(ing.product_id)) {
          resolvedIngredients.push(ing);
          continue;
        }
        // Try to find a substitute
        const subs = substitutesByProduct[ing.product_id] ?? [];
        const validSub = subs.find(
          (subId) => !excluded.has(subId) && productsById[subId]
        );
        if (!validSub) return null; // No valid substitute → recipe unusable
        resolvedIngredients.push({ ...ing, product_id: validSub });
      }
      return { ...recipe, ingredients: resolvedIngredients };
    },
    [excluded, substitutesByProduct, productsById]
  );

  // ── Context value ───────────────────────────────────────────
  const value = useMemo<DataContextValue>(() => {
    return {
      loading,
      products,
      recipes,
      plans,
      profile,
      substitutes,

      // ─── Products ──────────────────────────────────────────
      async upsertProduct(product, substituteIds = []) {
        await ProductRepo.upsertProduct(product, substituteIds);
        const [prods, subs] = await Promise.all([
          ProductRepo.getAllProducts(),
          ProductRepo.getAllSubstitutes(),
        ]);
        setProducts(prods);
        setSubstitutes(subs);
      },

      async deleteProduct(id) {
        await ProductRepo.deleteProduct(id);
        const [prods, recs, subs] = await Promise.all([
          ProductRepo.getAllProducts(),
          RecipeRepo.getAllRecipesWithDetails(),
          ProductRepo.getAllSubstitutes(),
        ]);
        setProducts(prods);
        setRecipes(recs);
        setSubstitutes(subs);
      },

      // ─── Recipes ───────────────────────────────────────────
      async upsertRecipe(recipe, ingredients, steps) {
        await RecipeRepo.upsertRecipe(recipe, ingredients, steps);
        setRecipes(await RecipeRepo.getAllRecipesWithDetails());
      },

      async deleteRecipe(id) {
        await RecipeRepo.deleteRecipe(id);
        const [recs, plns] = await Promise.all([
          RecipeRepo.getAllRecipesWithDetails(),
          PlanRepo.getAllPlans(),
        ]);
        setRecipes(recs);
        setPlans(plns);
      },

      // ─── Plans ─────────────────────────────────────────────
      async generatePlan(input) {
        const recipesByMeal: Record<MealType, RecipeWithDetails[]> = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
        };

        for (const recipe of recipes) {
          const resolved = resolveRecipe(recipe);
          if (!resolved) continue;
          recipesByMeal[resolved.meal_type].push(resolved);
        }

        for (const mt of MEAL_TYPES) {
          if (!recipesByMeal[mt].length) {
            throw new Error(`Keine gültigen Rezepte für ${mt}`);
          }
        }

        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
          throw new Error('Ungültiger Zeitraum');
        }

        const meals: { date: string; meal_type: MealType; recipe_id: string }[] = [];

        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const dateStr = day.toISOString().slice(0, 10);
          let selected: RecipeWithDetails[] | null = null;

          for (let attempt = 0; attempt < 100; attempt++) {
            const candidates = MEAL_TYPES.map((mt) => {
              const pool = recipesByMeal[mt];
              return pool[Math.floor(Math.random() * pool.length)];
            });

            const macros = candidates.reduce(
              (acc, recipe) => {
                const m = computeMacros(
                  recipe.ingredients.map((i) => ({
                    product_id: i.product_id,
                    amount_g: i.amount_g,
                  })),
                  productsById
                );
                return {
                  kcal: acc.kcal + m.kcal,
                  protein: acc.protein + m.protein,
                };
              },
              { kcal: 0, protein: 0 }
            );

            const withinCalories =
              macros.kcal >= input.calorieTarget * 0.9 &&
              macros.kcal <= input.calorieTarget * 1.1;

            if (withinCalories && macros.protein >= input.proteinTarget * 0.9) {
              selected = candidates;
              break;
            }
          }

          if (!selected) {
            // Fallback: use random meals even if macros don't perfectly match
            selected = MEAL_TYPES.map((mt) => {
              const pool = recipesByMeal[mt];
              return pool[Math.floor(Math.random() * pool.length)];
            });
          }

          for (const recipe of selected) {
            meals.push({
              date: dateStr,
              meal_type: recipe.meal_type,
              recipe_id: recipe.id,
            });
          }
        }

        await PlanRepo.createPlan(
          {
            id: uid('plan'),
            start_date: input.startDate,
            end_date: input.endDate,
            calorie_target: input.calorieTarget,
            protein_target: input.proteinTarget,
          },
          meals
        );

        setPlans(await PlanRepo.getAllPlans());
      },

      async deletePlan(id) {
        await PlanRepo.deletePlan(id);
        setPlans(await PlanRepo.getAllPlans());
      },

      getPlanById(id) {
        return plans.find((p) => p.id === id) ?? null;
      },

      // ─── Grocery ───────────────────────────────────────────
      getGroceryList(planId) {
        const plan = plans.find((p) => p.id === planId);
        if (!plan) return [];

        const totals = new Map<string, GroceryItem>();
        for (const meal of plan.meals) {
          const recipe = recipesById[meal.recipe_id];
          if (!recipe) continue;
          const resolved = resolveRecipe(recipe);
          if (!resolved) continue;

          for (const ing of resolved.ingredients) {
            const product = productsById[ing.product_id];
            if (!product) continue;
            const existing = totals.get(product.id);
            totals.set(product.id, {
              product_id: product.id,
              name: product.name,
              category: product.category,
              amount_g: (existing?.amount_g ?? 0) + ing.amount_g,
            });
          }
        }

        return [...totals.values()].sort((a, b) => a.name.localeCompare(b.name));
      },

      // ─── Recipe resolution ─────────────────────────────────
      getResolvedRecipe(recipeId) {
        const recipe = recipesById[recipeId];
        if (!recipe) return null;
        return resolveRecipe(recipe);
      },

      // ─── Macros ────────────────────────────────────────────
      getRecipeMacros(recipeId) {
        const recipe = recipesById[recipeId];
        if (!recipe) return { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
        const resolved = resolveRecipe(recipe);
        if (!resolved) return { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
        return computeMacros(
          resolved.ingredients.map((i) => ({
            product_id: i.product_id,
            amount_g: i.amount_g,
          })),
          productsById
        );
      },

      // ─── Profile ───────────────────────────────────────────
      async updateProfile(patch) {
        const next = { ...profile, ...patch };
        await setSetting(PROFILE_KEY, JSON.stringify(next));
        setProfile(next);
      },

      // ─── Import ────────────────────────────────────────────
      async importJson(payload) {
        let productCount = 0;
        let recipeCount = 0;

        // Import products
        if (payload.products?.length) {
          const substitutesMap: Record<string, string[]> = {};
          const prods = payload.products.map((p: ImportProduct) => {
            if (p.allowed_substitutes?.length) {
              substitutesMap[p.id] = p.allowed_substitutes;
            }
            return {
              id: p.id,
              name: p.name || '',
              category: p.category || '',
              image_uri: p.imageUri || p.image_uri || undefined,
              kcal_per_100g: p.kcal_per_100g || 0,
              protein_per_100g: p.protein_per_100g || 0,
              fat_per_100g: p.fat_per_100g || 0,
              carbs_per_100g: p.carbs_per_100g || 0,
              fiber_per_100g: p.fiber_per_100g || 0,
            };
          });
          productCount = await ProductRepo.bulkUpsertProducts(prods, substitutesMap);
        }

        // Import recipes
        if (payload.recipes?.length) {
          const recs = payload.recipes.map((r: ImportRecipe) => ({
            id: r.id || uid('recipe'),
            name: r.name || '',
            description: r.description || '',
            meal_type: r.mealType || r.meal_type || 'lunch' as MealType,
            tags: r.tags || [],
            ingredients: (r.ingredients || [])
              .map((ing) => normalizeIngredientKey(ing))
              .filter((ing) => !!ing.productId)
              .map((ing) => ({ product_id: ing.productId, amount_g: ing.amount_g })),
            steps: (r.instructions || []).map((text: string, i: number) => ({
              instruction: text,
              image_uri: (r.stepImageUris ?? r.step_image_uris ?? [])[i] || undefined,
            })),
          }));
          recipeCount = await RecipeRepo.bulkUpsertRecipes(recs);
        }

        // Reload all data
        await loadAll();

        return { products: productCount, recipes: recipeCount };
      },

      // ─── Export ────────────────────────────────────────────
      async exportJson() {
        const allProducts = await ProductRepo.getAllProducts();
        const allSubs = await ProductRepo.getAllSubstitutes();
        const allRecipes = await RecipeRepo.getAllRecipesWithDetails();
        const allPlans = await PlanRepo.getAllPlans();

        const subsByProduct: Record<string, string[]> = {};
        for (const s of allSubs) {
          if (!subsByProduct[s.product_id]) subsByProduct[s.product_id] = [];
          subsByProduct[s.product_id].push(s.substitute_id);
        }

        const exportData = {
          version: 2,
          exported_at: new Date().toISOString(),
          profile,
          products: allProducts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            image_uri: p.image_uri,
            kcal_per_100g: p.kcal_per_100g,
            protein_per_100g: p.protein_per_100g,
            fat_per_100g: p.fat_per_100g,
            carbs_per_100g: p.carbs_per_100g,
            fiber_per_100g: p.fiber_per_100g,
            allowed_substitutes: subsByProduct[p.id] ?? [],
          })),
          recipes: allRecipes.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            meal_type: r.meal_type,
            tags: r.tags,
            ingredients: r.ingredients.map((ing) => ({
              product_id: ing.product_id,
              amount_g: ing.amount_g,
            })),
            instructions: r.steps.map((s) => s.instruction),
            step_image_uris: r.steps.map((s) => s.image_uri ?? ''),
          })),
          plans: allPlans.map((p) => ({
            id: p.id,
            start_date: p.start_date,
            end_date: p.end_date,
            calorie_target: p.calorie_target,
            protein_target: p.protein_target,
            meals: p.meals.map((m) => ({
              date: m.date,
              meal_type: m.meal_type,
              recipe_id: m.recipe_id,
            })),
          })),
        };

        return JSON.stringify(exportData, null, 2);
      },

      // ─── Reset ─────────────────────────────────────────────
      async clearData() {
        await resetData();
        setProducts([]);
        setRecipes([]);
        setPlans([]);
        setSubstitutes([]);
      },

      async clearAll() {
        await resetAll();
        await AsyncStorage.removeItem(MIGRATION_DONE_KEY);
        setProducts([]);
        setRecipes([]);
        setPlans([]);
        setSubstitutes([]);
        setProfile(defaultProfile);
      },

      // ─── Reload ────────────────────────────────────────────
      async reload() {
        await loadAll();
      },
    };
  }, [loading, products, recipes, plans, profile, substitutes, productsById, recipesById, substitutesByProduct, excluded, resolveRecipe, loadAll]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
