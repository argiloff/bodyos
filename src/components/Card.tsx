import React from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useThemePalette, spacing, radii, shadows } from "../theme";

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "flat";
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, variant = "default", style }: Props) {
  const theme = useThemePalette();

  const containerStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: variant === "flat" ? 0 : 1,
    borderColor: theme.border,
    ...(variant === "elevated"
      ? shadows.md
      : variant === "default"
        ? shadows.sm
        : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
});
