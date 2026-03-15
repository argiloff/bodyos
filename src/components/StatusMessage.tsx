import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useThemePalette, spacing, radii, typography } from '../theme';

type Variant = 'info' | 'success' | 'error' | 'warning';

type Props = {
  message: string;
  variant?: Variant;
  autoHide?: boolean;
  style?: ViewStyle;
};

export function StatusMessage({ message, variant = 'info', autoHide = true, style }: Props) {
  const theme = useThemePalette();
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (autoHide) {
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, opacity]);

  if (!message) return null;

  const bgColors: Record<Variant, string> = {
    info: theme.infoLight,
    success: theme.successLight,
    error: theme.dangerLight,
    warning: theme.warningLight,
  };

  const textColors: Record<Variant, string> = {
    info: theme.info,
    success: theme.success,
    error: theme.danger,
    warning: theme.warning,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColors[variant], opacity },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColors[variant] }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.captionBold,
  },
});
