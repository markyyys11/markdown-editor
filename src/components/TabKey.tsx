import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {fontSize, monoFontStack, palette, radius, spacing} from '../theme/theme';

type Props = {
  onPress(): void;
};

/**
 * The Tab key, floating just above the symbol bar.
 *
 * It is positioned absolutely inside the editing area rather than laid out in a
 * row of its own, so the panel below it can stay as short as it is.
 */
export function TabKey({onPress}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Табуляция"
      onPress={onPress}
      android_ripple={{color: palette.borderDefault}}
      style={({pressed}) => [styles.key, pressed ? styles.pressed : null]}>
      <Text style={styles.label}>Tab</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  key: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    minWidth: 58,
    height: 34,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.canvasSubtle,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  pressed: {backgroundColor: palette.borderDefault},
  label: {
    color: palette.accent,
    fontFamily: monoFontStack,
    fontSize: fontSize.label,
    fontWeight: '600',
  },
});
