import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { useThemePalette, spacing, radii, typography } from '../theme';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;
  containerStyle?: ViewStyle;
};

export function Input({ label, hint, error, suffix, containerStyle, style, ...rest }: Props) {
  const theme = useThemePalette();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.danger
    : focused
    ? theme.inputFocusBorder
    : theme.inputBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      ) : null}
      <View style={[styles.inputRow, { borderColor, backgroundColor: theme.inputBackground }]}>
        <TextInput
          placeholderTextColor={theme.placeholder}
          style={[
            styles.input,
            { color: theme.text },
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        {suffix ? (
          <Text style={[styles.suffix, { color: theme.muted }]}>{suffix}</Text>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.hint, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.captionBold,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  suffix: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  hint: {
    ...typography.small,
  },
});
