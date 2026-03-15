import { useColorScheme } from "react-native";
import type { MealType } from "./types";

// ─── Spacing Scale ────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

// ─── Border Radii ─────────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

// ─── Typography ───────────────────────────────────────────────
export const typography = {
  hero: { fontSize: 28, fontWeight: "800" as const, lineHeight: 34 },
  title: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  subtitle: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: "700" as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: "400" as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: "700" as const, lineHeight: 22 },
  chip: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  tab: { fontSize: 12, fontWeight: "600" as const, lineHeight: 16 },
} as const;

// ─── Shadows ──────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Color Palette ────────────────────────────────────────────
export type ThemePalette = {
  // Backgrounds
  background: string;
  card: string;
  cardAlt: string;
  surface: string;

  // Borders
  border: string;
  borderLight: string;

  // Text
  text: string;
  textSecondary: string;
  muted: string;
  placeholder: string;

  // Accent / Primary
  accent: string;
  accentLight: string;
  accentText: string;

  // Semantic
  danger: string;
  dangerLight: string;
  dangerText: string;
  success: string;
  successLight: string;
  successText: string;
  warning: string;
  warningLight: string;
  warningText: string;
  info: string;
  infoLight: string;
  infoText: string;

  // Meal type colors
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;

  // Progress bar
  progressTrack: string;
  progressFill: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
};

const lightPalette: ThemePalette = {
  // Backgrounds
  background: "#f5f7fa",
  card: "#ffffff",
  cardAlt: "#f0f4f8",
  surface: "#e8edf2",

  // Borders
  border: "#dce1e8",
  borderLight: "#eaeff4",

  // Text
  text: "#0f172a",
  textSecondary: "#334155",
  muted: "#64748b",
  placeholder: "#94a3b8",

  // Accent
  accent: "#059669",
  accentLight: "#d1fae5",
  accentText: "#ffffff",

  // Semantic
  danger: "#dc2626",
  dangerLight: "#fee2e2",
  dangerText: "#ffffff",
  success: "#16a34a",
  successLight: "#dcfce7",
  successText: "#ffffff",
  warning: "#d97706",
  warningLight: "#fef3c7",
  warningText: "#ffffff",
  info: "#2563eb",
  infoLight: "#dbeafe",
  infoText: "#ffffff",

  // Meal type colors
  breakfast: "#f59e0b",
  lunch: "#059669",
  dinner: "#7c3aed",
  snack: "#ec4899",

  // Progress
  progressTrack: "#e2e8f0",
  progressFill: "#059669",

  // Input
  inputBackground: "#ffffff",
  inputBorder: "#d1d5db",
  inputFocusBorder: "#059669",
};

const darkPalette: ThemePalette = {
  // Backgrounds
  background: "#0a0e17",
  card: "#111827",
  cardAlt: "#0d1321",
  surface: "#1e293b",

  // Borders
  border: "#1e293b",
  borderLight: "#1a2332",

  // Text
  text: "#f1f5f9",
  textSecondary: "#cbd5e1",
  muted: "#94a3b8",
  placeholder: "#64748b",

  // Accent
  accent: "#34d399",
  accentLight: "#064e3b",
  accentText: "#0f172a",

  // Semantic
  danger: "#ef4444",
  dangerLight: "#450a0a",
  dangerText: "#fca5a5",
  success: "#22c55e",
  successLight: "#052e16",
  successText: "#86efac",
  warning: "#f59e0b",
  warningLight: "#451a03",
  warningText: "#fcd34d",
  info: "#3b82f6",
  infoLight: "#172554",
  infoText: "#93c5fd",

  // Meal type colors
  breakfast: "#fbbf24",
  lunch: "#34d399",
  dinner: "#a78bfa",
  snack: "#f472b6",

  // Progress
  progressTrack: "#1e293b",
  progressFill: "#34d399",

  // Input
  inputBackground: "#0d1321",
  inputBorder: "#1e293b",
  inputFocusBorder: "#34d399",
};

// ─── Hook ─────────────────────────────────────────────────────
export function useThemePalette(): ThemePalette {
  const scheme = useColorScheme();
  return scheme === "light" ? lightPalette : darkPalette;
}

// ─── Helpers ──────────────────────────────────────────────────

export function mealTypeLabel(mealType: MealType): string {
  switch (mealType) {
    case "breakfast":
      return "Frühstück";
    case "lunch":
      return "Mittagessen";
    case "dinner":
      return "Abendessen";
    case "snack":
      return "Snack";
    default:
      return mealType;
  }
}

export function mealTypeColor(mealType: MealType, theme: ThemePalette): string {
  return theme[mealType];
}

export function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    protein: "Proteinquelle",
    dairy: "Milchprodukt",
    supplement: "Supplement",
    carb: "Kohlenhydrate",
    fruit: "Obst",
    vegetable: "Gemüse",
    fat: "Fettquelle",
    seed: "Samen",
    spread: "Aufstrich",
    legume: "Hülsenfrucht",
    snack: "Snack",
    sweetener: "Süßungsmittel",
    sauce: "Sauce",
    grain: "Getreide",
    nut: "Nuss",
    oil: "Öl",
    beverage: "Getränk",
  };
  return map[category.toLowerCase()] ?? category;
}

/**
 * Build common styles for a card container based on theme.
 */
export function cardStyle(theme: ThemePalette) {
  return {
    backgroundColor: theme.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.lg,
    ...shadows.sm,
  } as const;
}

/**
 * Build common styles for a section title.
 */
export function sectionTitleStyle(theme: ThemePalette) {
  return {
    ...typography.subtitle,
    color: theme.text,
    marginBottom: spacing.sm,
  } as const;
}
