import { getDatabase } from '../db/schema';
import type { Product, ProductSubstitute, ProductInsert } from '../types';
import { uid } from '../types';

// ─── Read ─────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDatabase();
  return db.getAllAsync<Product>('SELECT * FROM products ORDER BY name COLLATE NOCASE');
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
}

export async function searchProducts(query: string, limit: number = 20): Promise<Product[]> {
  const db = await getDatabase();
  const pattern = `%${query}%`;
  return db.getAllAsync<Product>(
    'SELECT * FROM products WHERE name LIKE ? OR id LIKE ? OR category LIKE ? ORDER BY name COLLATE NOCASE LIMIT ?',
    pattern, pattern, pattern, limit
  );
}

export async function getProductCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');
  return row?.count ?? 0;
}

// ─── Substitutes ──────────────────────────────────────────────

export async function getSubstitutes(productId: string): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ProductSubstitute>(
    'SELECT * FROM product_substitutes WHERE product_id = ?',
    productId
  );
  return rows.map(r => r.substitute_id);
}

export async function getAllSubstitutes(): Promise<ProductSubstitute[]> {
  const db = await getDatabase();
  return db.getAllAsync<ProductSubstitute>('SELECT * FROM product_substitutes');
}

export async function setSubstitutes(productId: string, substituteIds: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM product_substitutes WHERE product_id = ?', productId);
  for (const subId of substituteIds) {
    // Only insert if substitute product actually exists
    const exists = await db.getFirstAsync<{ id: string }>('SELECT id FROM products WHERE id = ?', subId);
    if (exists) {
      await db.runAsync(
        'INSERT OR IGNORE INTO product_substitutes (product_id, substitute_id) VALUES (?, ?)',
        productId, subId
      );
    }
  }
}

// ─── Write ────────────────────────────────────────────────────

export async function upsertProduct(product: ProductInsert, substituteIds: string[] = []): Promise<Product> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await getProductById(product.id);

  if (existing) {
    await db.runAsync(
      `UPDATE products SET
        name = ?, category = ?, image_uri = ?,
        kcal_per_100g = ?, protein_per_100g = ?, fat_per_100g = ?,
        carbs_per_100g = ?, fiber_per_100g = ?, updated_at = ?
      WHERE id = ?`,
      product.name, product.category, product.image_uri ?? null,
      product.kcal_per_100g, product.protein_per_100g, product.fat_per_100g,
      product.carbs_per_100g, product.fiber_per_100g, now,
      product.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO products (id, name, category, image_uri, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id, product.name, product.category, product.image_uri ?? null,
      product.kcal_per_100g, product.protein_per_100g, product.fat_per_100g,
      product.carbs_per_100g, product.fiber_per_100g, now, now
    );
  }

  // Update substitutes
  await setSubstitutes(product.id, substituteIds);

  return (await getProductById(product.id))!;
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM products WHERE id = ?', id);
}

// ─── Bulk ─────────────────────────────────────────────────────

export async function bulkUpsertProducts(
  products: ProductInsert[],
  substitutesMap: Record<string, string[]> = {}
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  let count = 0;

  await db.execAsync('BEGIN TRANSACTION');
  try {
    for (const p of products) {
      if (!p.id) continue;
      await db.runAsync(
        `INSERT OR REPLACE INTO products (id, name, category, image_uri, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM products WHERE id = ?), ?), ?)`,
        p.id, p.name, p.category, p.image_uri ?? null,
        p.kcal_per_100g, p.protein_per_100g, p.fat_per_100g,
        p.carbs_per_100g, p.fiber_per_100g,
        p.id, now, now
      );
      count++;
    }

    // Set substitutes after all products are inserted
    for (const [productId, subs] of Object.entries(substitutesMap)) {
      await db.runAsync('DELETE FROM product_substitutes WHERE product_id = ?', productId);
      for (const subId of subs) {
        const exists = await db.getFirstAsync<{ id: string }>('SELECT id FROM products WHERE id = ?', subId);
        if (exists) {
          await db.runAsync(
            'INSERT OR IGNORE INTO product_substitutes (product_id, substitute_id) VALUES (?, ?)',
            productId, subId
          );
        }
      }
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  return count;
}
