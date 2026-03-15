import * as SQLite from 'expo-sqlite';

// ─── Database Instance ────────────────────────────────────────
const DB_NAME = 'bodyos.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(_db);
  return _db;
}

// ─── Migrations ───────────────────────────────────────────────

const MIGRATIONS: string[] = [
  // ── Migration 0: Initial schema ──
  `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    image_uri TEXT,
    kcal_per_100g REAL NOT NULL DEFAULT 0,
    protein_per_100g REAL NOT NULL DEFAULT 0,
    fat_per_100g REAL NOT NULL DEFAULT 0,
    carbs_per_100g REAL NOT NULL DEFAULT 0,
    fiber_per_100g REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_substitutes (
    product_id TEXT NOT NULL,
    substitute_id TEXT NOT NULL,
    PRIMARY KEY (product_id, substitute_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (substitute_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    meal_type TEXT NOT NULL DEFAULT 'lunch' CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id TEXT PRIMARY KEY NOT NULL,
    recipe_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    amount_g REAL NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recipe_steps (
    id TEXT PRIMARY KEY NOT NULL,
    recipe_id TEXT NOT NULL,
    step_number INTEGER NOT NULL DEFAULT 0,
    instruction TEXT NOT NULL DEFAULT '',
    image_uri TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    calorie_target REAL NOT NULL DEFAULT 2000,
    protein_target REAL NOT NULL DEFAULT 140,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plan_meals (
    id TEXT PRIMARY KEY NOT NULL,
    plan_id TEXT NOT NULL,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
    recipe_id TEXT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_plan_meals_plan ON plan_meals(plan_id);
  CREATE INDEX IF NOT EXISTS idx_plan_meals_date ON plan_meals(date);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
  `,
];

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create a migration tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Check current version
  const row = await db.getFirstAsync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _migrations'
  );
  const currentVersion = row?.max_version ?? -1;

  // Apply pending migrations
  for (let i = currentVersion + 1; i < MIGRATIONS.length; i++) {
    await db.execAsync(MIGRATIONS[i]);
    await db.runAsync('INSERT INTO _migrations (version) VALUES (?)', i);
  }
}

// ─── Settings helpers ─────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM settings WHERE key = ?', key);
}

// ─── Reset helpers ────────────────────────────────────────────

/**
 * Delete all user data (products, recipes, plans) but keep settings.
 */
export async function resetData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM plan_meals;
    DELETE FROM plans;
    DELETE FROM recipe_steps;
    DELETE FROM recipe_ingredients;
    DELETE FROM recipes;
    DELETE FROM product_substitutes;
    DELETE FROM products;
  `);
}

/**
 * Drop all tables and re-run migrations (full factory reset).
 */
export async function resetAll(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS plan_meals;
    DROP TABLE IF EXISTS plans;
    DROP TABLE IF EXISTS recipe_steps;
    DROP TABLE IF EXISTS recipe_ingredients;
    DROP TABLE IF EXISTS recipes;
    DROP TABLE IF EXISTS product_substitutes;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS _migrations;
  `);
  await runMigrations(db);
}

/**
 * Close the database connection (useful for testing or app shutdown).
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}
