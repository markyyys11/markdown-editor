import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {
  controlHeight,
  fontSize,
  palette,
  radius,
  spacing,
} from '../theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress(): void;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS: Record<
  ButtonVariant,
  {container: StyleProp<ViewStyle>; label: StyleProp<TextStyle>; tint: string}
> = {
  primary: {
    container: {backgroundColor: palette.accent, borderColor: palette.accent},
    label: {color: '#ffffff'},
    tint: '#ffffff',
  },
  secondary: {
    container: {
      backgroundColor: palette.canvasSubtle,
      borderColor: palette.borderDefault,
    },
    label: {color: palette.fgDefault},
    tint: palette.fgDefault,
  },
  danger: {
    container: {backgroundColor: 'transparent', borderColor: palette.red},
    label: {color: palette.red},
    tint: palette.red,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
}: Props) {
  const inactive = disabled || busy;
  const variantStyle = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: inactive, busy}}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{color: palette.borderDefault}}
      style={({pressed}) => [
        styles.base,
        variantStyle.container,
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.inactive : null,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color={variantStyle.tint} />
      ) : (
        <Text style={[styles.label, variantStyle.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  pressed: {opacity: 0.75},
  inactive: {opacity: 0.45},
});
