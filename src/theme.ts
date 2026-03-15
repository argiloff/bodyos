import { useColorScheme } from 'react-native';
import type { MealType } from './auth/AuthContext';

export type ThemePalette = {
  background: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  danger: string;
  dangerText: string;
};

export function useThemePalette(): ThemePalette {
  const scheme = useColorScheme();
  const dark = scheme !== 'light';

  if (dark) {
    return {
      background: '#07090f',
      card: '#10172a',
      cardAlt: '#0b1220',
      border: '#1f2937',
      text: '#f8fafc',
      muted: '#94a3b8',
      accent: '#6ee7b7',
      accentText: '#111827',
      danger: '#b91c1c',
      dangerText: '#ffffff',
    };
  }

  return {
    background: '#f8fafc',
    card: '#ffffff',
    cardAlt: '#f1f5f9',
    border: '#d6dee8',
    text: '#0f172a',
    muted: '#475569',
    accent: '#16a34a',
    accentText: '#ffffff',
    danger: '#dc2626',
    dangerText: '#ffffff',
  };
}

export function mealTypeLabel(mealType: MealType): string {
  switch (mealType) {
    case 'breakfast':
      return 'Frühstück';
    case 'lunch':
      return 'Mittagessen';
    case 'dinner':
      return 'Abendessen';
    case 'snack':
      return 'Snack';
    default:
      return mealType;
  }
}
