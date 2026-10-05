import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { controlHeight, fontSize, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress(): void;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyle = (
  theme: AppTheme,
  variant: ButtonVariant,
): {
  container: StyleProp<ViewStyle>;
  label: StyleProp<TextStyle>;
  tint: string;
} => {
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: theme.ui.accent,
          borderColor: theme.ui.accent,
        },
        label: { color: '#ffffff' },
        tint: '#ffffff',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: theme.ui.canvasSubtle,
          borderColor: theme.ui.borderDefault,
        },
        label: { color: theme.ui.fgDefault },
        tint: theme.ui.fgDefault,
      };
    case 'danger':
      return {
        container: {
          backgroundColor: 'transparent',
          borderColor: theme.ui.danger,
        },
        label: { color: theme.ui.danger },
        tint: theme.ui.danger,
      };
  }
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || busy;
  const variantColors = variantStyle(theme, variant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: theme.ui.borderDefault }}
      style={({ pressed }) => [
        styles.base,
        variantColors.container,
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.inactive : null,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={variantColors.tint} />
      ) : (
        <Text style={[styles.label, variantColors.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    base: {
      minHeight: controlHeight,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    label: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.body,
      fontWeight: '600',
    },
    pressed: { opacity: 0.75 },
    inactive: { opacity: 0.45 },
  });
