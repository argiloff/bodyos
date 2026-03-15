import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemePalette, spacing, typography } from '../theme';

type Props = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
};

export function Empty({ icon, title, message, action }: Props) {
  const theme = useThemePalette();

  return (
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
