import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemePalette, spacing, radii, typography } from '../theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  style?: ViewStyle;
};

export function Chip({ label, selected = false, onPress, color, style }: Props) {
  const theme = useThemePalette();

  const bg = selected ? (color ?? theme.accent) : theme.cardAlt;
  const textColor = selected ? theme.accentText : theme.text;
  const borderColor = selected ? (color ?? theme.accent) : theme.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.chip,
  },
});
