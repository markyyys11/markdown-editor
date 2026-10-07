import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fontSize, monoFontStack, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

type Props = {
  onPress(): void;
};

/**
 * The Tab key, floating just above the symbol bar.
 *
 * It is positioned absolutely inside the editing area rather than laid out in a
 * row of its own, so the panel below it can stay as short as it is.
 */
export function TabKey({ onPress }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tab"
      onPress={onPress}
      android_ripple={{ color: theme.ui.borderDefault }}
      style={({ pressed }) => [styles.key, pressed ? styles.pressed : null]}
    >
      <Text style={styles.label}>Tab</Text>
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    key: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      minWidth: 58,
      height: 34,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.ui.canvasSubtle,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.lg,
      overflow: 'hidden',
      elevation: 4,
    },
    pressed: { backgroundColor: theme.ui.borderDefault },
    label: {
      color: theme.ui.accent,
      fontFamily: monoFontStack,
      fontSize: fontSize.label,
      fontWeight: '600',
    },
  });
