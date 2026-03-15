import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemePalette, spacing, radii, typography } from '../theme';
import type { Macros } from '../types';

type Props = {
  macros: Macros;
  compact?: boolean;
};

export function MacroBadge({ macros, compact = false }: Props) {
  const theme = useThemePalette();

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Text style={[styles.compactText, { color: theme.accent }]}>
          {Math.round(macros.kcal)} kcal
        </Text>
        <Text style={[styles.dot, { color: theme.muted }]}>·</Text>
        <Text style={[styles.compactText, { color: theme.text }]}>
          {Math.round(macros.protein)}g P
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: theme.accentLight }]}>
        <Text style={[styles.badgeValue, { color: theme.accent }]}>
          {Math.round(macros.kcal)}
        </Text>
        <Text style={[styles.badgeLabel, { color: theme.accent }]}>kcal</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.infoLight }]}>
        <Text style={[styles.badgeValue, { color: theme.info }]}>
          {Math.round(macros.protein)}g
        </Text>
        <Text style={[styles.badgeLabel, { color: theme.info }]}>Protein</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.warningLight }]}>
        <Text style={[styles.badgeValue, { color: theme.warning }]}>
          {Math.round(macros.fat)}g
        </Text>
        <Text style={[styles.badgeLabel, { color: theme.warning }]}>Fett</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: theme.cardAlt }]}>
        <Text style={[styles.badgeValue, { color: theme.textSecondary }]}>
          {Math.round(macros.carbs)}g
        </Text>
        <Text style={[styles.badgeLabel, { color: theme.muted }]}>Carbs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 64,
  },
  badgeValue: {
    ...typography.bodyBold,
  },
  badgeLabel: {
    ...typography.small,
    marginTop: 1,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactText: {
    ...typography.captionBold,
  },
  dot: {
    ...typography.caption,
  },
});
