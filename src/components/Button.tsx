import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useThemePalette, spacing, radii, typography, shadows } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: Props) {
  const theme = useThemePalette();

  const bgColors: Record<ButtonVariant, string> = {
    primary: theme.accent,
    secondary: theme.cardAlt,
    danger: theme.danger,
    ghost: 'transparent',
    outline: 'transparent',
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: theme.accentText,
    secondary: theme.text,
    danger: theme.dangerText,
    ghost: theme.accent,
    outline: theme.accent,
  };

  const heights: Record<ButtonSize, number> = {
    sm: 36,
    md: 46,
    lg: 54,
  };

  const fontSizes: Record<ButtonSize, TextStyle> = {
    sm: { fontSize: 13, fontWeight: '600' },
    md: typography.button,
    lg: { fontSize: 18, fontWeight: '700' },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColors[variant],
          height: heights[size],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? theme.accent : undefined,
        },
        fullWidth && styles.fullWidth,
        ...((variant !== 'ghost' && variant !== 'outline') ? [shadows.sm] : []),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              fontSizes[size],
              { color: textColors[variant], marginLeft: icon ? spacing.sm : 0 },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
