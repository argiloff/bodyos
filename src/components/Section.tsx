import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemePalette, spacing, typography } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  action?: React.ReactNode;
};

export function Section({ title, subtitle, children, style, action }: Props) {
  const theme = useThemePalette();

  return (
    <View style={[styles.container, style]}>
      {(title || action) ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={[styles.title, { color: theme.text }]}>{title}</Text> : null}
            {subtitle ? <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.subtitle,
  },
  subtitle: {
    ...typography.caption,
  },
});
