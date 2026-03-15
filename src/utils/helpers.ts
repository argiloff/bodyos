/**
 * Generate a short unique ID with an optional prefix.
 * Example: uid('plan') => 'plan-a8f3bc2e'
 */
export function uid(prefix: string = 'id'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}-${random}${time}`;
}

/**
 * Convert a string into a URL-safe slug.
 * Example: slugify('Hähnchenbrust mit Reis!') => 'hahnchenbrust-mit-reis'
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Format a Date to 'YYYY-MM-DD'.
 */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Get today's date string.
 */
export function today(): string {
  return formatDate(new Date());
}

/**
 * Get a date N days from now as a string.
 */
export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

/**
 * Iterate over each date string between start and end (inclusive).
 */
export function eachDay(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to N decimal places (default 1).
 */
export function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Pick a random item from an array.
 */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Group an array by a key function.
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

/**
 * Safe JSON parse – returns null on failure instead of throwing.
 */
export function safeJsonParse<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Normalize an ingredient record that may use product_id or productId.
 */
export function normalizeIngredientKey(
  ingredient: { productId?: string; product_id?: string; amount_g: number }
): { productId: string; amount_g: number } {
  return {
    productId: ingredient.productId ?? ingredient.product_id ?? '',
    amount_g: ingredient.amount_g,
  };
}
