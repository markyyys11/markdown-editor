import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

type Props = {
  label: string;
  onPress(): void;
  selected?: boolean;
};

/** Small, secondary control for toolbars — branch, filters and the like. */
export function Chip({ label, onPress, selected = false }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      android_ripple={{ color: theme.ui.borderDefault }}
      style={[styles.chip, selected ? styles.selected : null]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    chip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: theme.ui.canvasDefault,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    selected: {
      backgroundColor: theme.ui.canvasSubtle,
      borderColor: theme.ui.accent,
    },
    label: { color: theme.ui.fgMuted, fontSize: fontSize.label },
    labelSelected: { color: theme.ui.fgDefault, fontWeight: '600' },
  });
