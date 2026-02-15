import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

type User = {
  id: string;
  email: string;
  password: string;
};

type Profile = {
  userId: string;
  calorieTarget: number;
  proteinTarget: number;
  excludedProducts: string[];
};

type Product = {
  id: string;
  name: string;
  category: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  fiber_per_100g: number;
  allowed_substitutes: string[];
};

type RecipeIngredient = {
  productId: string;
  amount_g: number;
};

type Recipe = {
  id: string;
  name: string;
  description: string;
  mealType: MealType;
  tags: string[];
  instructions: string[];
  ingredients: RecipeIngredient[];
};

type PlanMeal = {
  date: string;
  mealType: MealType;
  recipeId: string;
};

type Plan = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  calorieTarget: number;
  proteinTarget: number;
  meals: PlanMeal[];
};

type Store = {
  users: User[];
  profiles: Profile[];
  products: Product[];
  recipes: Recipe[];
  plans: Plan[];
};

type ImportPayload = {
  products: Product[];
  recipes: Array<
    Omit<Recipe, "ingredients"> & {
      ingredients: Array<{ productId?: string; product_id?: string; amount_g: number }>;
    }
  >;
};

type Macro = {
  kcal: number;
  protein: number;
};

type AuthContextValue = {
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  products: Product[];
  recipes: Recipe[];
  plans: Plan[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  importJson: (payload: ImportPayload) => Promise<{ products: number; recipes: number }>;
  clearSoft: () => Promise<void>;
  clearHard: () => Promise<void>;
  generatePlan: (input: {
    startDate: string;
    endDate: string;
    calorieTarget: number;
    proteinTarget: number;
  }) => Promise<void>;
};

const STORAGE_KEY = "bodyos_store_v1";
const SESSION_KEY = "bodyos_session_v1";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const defaultUser: User = {
  id: "u-demo",
  email: "demo@bodyos.local",
  password: "Passw0rd!",
};

const defaultProfile: Profile = {
  userId: defaultUser.id,
  calorieTarget: 2000,
  proteinTarget: 140,
  excludedProducts: [],
};

const initialStore: Store = {
  users: [defaultUser],
  profiles: [defaultProfile],
  products: [],
  recipes: [],
  plans: [],
};

const AuthContext = createContext<AuthContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeIngredient(ingredient: { productId?: string; product_id?: string; amount_g: number }) {
  return {
    productId: ingredient.productId ?? ingredient.product_id ?? "",
    amount_g: ingredient.amount_g,
  };
}

function computeRecipeMacro(recipe: Recipe, productsById: Record<string, Product>): Macro {
  return recipe.ingredients.reduce(
    (acc, ing) => {
      const product = productsById[ing.productId];
      if (!product) return acc;
      const factor = ing.amount_g / 100;
      return {
        kcal: acc.kcal + product.kcal_per_100g * factor,
        protein: acc.protein + product.protein_per_100g * factor,
      };
    },
    { kcal: 0, protein: 0 }
  );
}

function substituteRecipe(recipe: Recipe, excluded: Set<string>, productsById: Record<string, Product>): Recipe | null {
  const ingredients: RecipeIngredient[] = [];
  for (const ing of recipe.ingredients) {
    if (!excluded.has(ing.productId)) {
      ingredients.push(ing);
      continue;
    }
    const original = productsById[ing.productId];
    if (!original) return null;
    const substitute = original.allowed_substitutes.find((candidate) => !excluded.has(candidate) && productsById[candidate]);
    if (!substitute) return null;
    ingredients.push({ ...ing, productId: substitute });
  }
  return { ...recipe, ingredients };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store>(initialStore);
  const [user, setUser] = useState<User | null>(null);

  async function persist(nextStore: Store) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
    setStore(nextStore);
  }

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const [rawStore, rawSession] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        const parsedStore = rawStore ? (JSON.parse(rawStore) as Store) : initialStore;
        if (mounted) setStore(parsedStore);
        if (rawSession && mounted) {
          const found = parsedStore.users.find((entry) => entry.id === rawSession);
          setUser(found ?? null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const profile = user ? store.profiles.find((entry) => entry.userId === user.id) ?? null : null;

    return {
      loading,
      user,
      profile,
      products: store.products,
      recipes: store.recipes,
      plans: user ? store.plans.filter((plan) => plan.userId === user.id) : [],
      async login(email: string, password: string) {
        const existing = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
        if (!existing || existing.password !== password) {
          throw new Error("Ungültige Zugangsdaten");
        }
        await AsyncStorage.setItem(SESSION_KEY, existing.id);
        setUser(existing);
      },
      async logout() {
        await AsyncStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
      async updateProfile(patch: Partial<Profile>) {
        if (!user) throw new Error("Nicht eingeloggt");
        const nextProfiles = [...store.profiles];
        const idx = nextProfiles.findIndex((entry) => entry.userId === user.id);
        if (idx >= 0) {
          nextProfiles[idx] = { ...nextProfiles[idx], ...patch, userId: user.id };
        } else {
          nextProfiles.push({
            userId: user.id,
            calorieTarget: 2000,
            proteinTarget: 140,
            excludedProducts: [],
            ...patch,
          });
        }
        await persist({ ...store, profiles: nextProfiles });
      },
      async importJson(payload: ImportPayload) {
        if (!user) throw new Error("Nicht eingeloggt");
        const productsById = new Map<string, Product>(store.products.map((p) => [p.id, p]));
        for (const product of payload.products) {
          productsById.set(product.id, { ...product, allowed_substitutes: product.allowed_substitutes ?? [] });
        }
        const nextProducts = [...productsById.values()];

        const recipesById = new Map<string, Recipe>(store.recipes.map((r) => [r.id, r]));
        for (const recipe of payload.recipes) {
          const normalizedIngredients = recipe.ingredients.map(normalizeIngredient).filter((ing) => !!ing.productId);
          recipesById.set(recipe.id || uid("recipe"), {
            id: recipe.id || uid("recipe"),
            name: recipe.name,
            description: recipe.description ?? "",
            mealType: recipe.mealType,
            tags: recipe.tags ?? [],
            instructions: recipe.instructions ?? [],
            ingredients: normalizedIngredients,
          });
        }
        const nextRecipes = [...recipesById.values()];
        await persist({ ...store, products: nextProducts, recipes: nextRecipes });
        return { products: payload.products.length, recipes: payload.recipes.length };
      },
      async clearSoft() {
        await persist({ ...store, products: [], recipes: [], plans: [] });
      },
      async clearHard() {
        await persist(initialStore);
        await AsyncStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
      async generatePlan(input) {
        if (!user) throw new Error("Nicht eingeloggt");
        const profileNow = store.profiles.find((entry) => entry.userId === user.id) ?? defaultProfile;
        const excluded = new Set(profileNow.excludedProducts);
        const productsById = Object.fromEntries(store.products.map((p) => [p.id, p])) as Record<string, Product>;
        const recipesByMeal: Record<MealType, Recipe[]> = {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: [],
        };

        for (const recipe of store.recipes) {
          const substituted = substituteRecipe(recipe, excluded, productsById);
          if (!substituted) continue;
          recipesByMeal[substituted.mealType].push(substituted);
        }

        for (const mealType of MEAL_TYPES) {
          if (!recipesByMeal[mealType].length) {
            throw new Error(`Keine gültigen Rezepte für ${mealType}`);
          }
        }

        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
          throw new Error("Ungültiger Zeitraum");
        }

        const meals: PlanMeal[] = [];
        for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
          const date = day.toISOString().slice(0, 10);
          let selected: Recipe[] | null = null;
          for (let i = 0; i < 60; i += 1) {
            const attempt = MEAL_TYPES.map((mealType) => {
              const pool = recipesByMeal[mealType];
              return pool[Math.floor(Math.random() * pool.length)];
            });
            const macro = attempt.reduce(
              (acc, recipe) => {
                const recipeMacro = computeRecipeMacro(recipe, productsById);
                return { kcal: acc.kcal + recipeMacro.kcal, protein: acc.protein + recipeMacro.protein };
              },
              { kcal: 0, protein: 0 }
            );
            const withinCalories = macro.kcal >= input.calorieTarget * 0.95 && macro.kcal <= input.calorieTarget * 1.05;
            if (withinCalories && macro.protein >= input.proteinTarget) {
              selected = attempt;
              break;
            }
          }
          if (!selected) {
            throw new Error(`Kein gültiger Tagesplan für ${date}`);
          }
          for (const recipe of selected) {
            meals.push({ date, mealType: recipe.mealType, recipeId: recipe.id });
          }
        }

        const nextPlan: Plan = {
          id: uid("plan"),
          userId: user.id,
          startDate: input.startDate,
          endDate: input.endDate,
          calorieTarget: input.calorieTarget,
          proteinTarget: input.proteinTarget,
          meals,
        };
        await persist({ ...store, plans: [nextPlan, ...store.plans] });
      },
    };
  }, [loading, store, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
