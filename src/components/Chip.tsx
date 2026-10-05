import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {fontSize, palette, radius, spacing} from '../theme/theme';

type Props = {
  label: string;
  onPress(): void;
  selected?: boolean;
};

/** Small, secondary control for toolbars — branch, filters and the like. */
export function Chip({label, onPress, selected = false}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}
      onPress={onPress}
      android_ripple={{color: palette.borderDefault}}
      style={[styles.chip, selected ? styles.selected : null]}>
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.canvasDefault,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  selected: {
    backgroundColor: palette.canvasSubtle,
    borderColor: palette.accent,
  },
  label: {color: palette.fgMuted, fontSize: fontSize.label},
  labelSelected: {color: palette.fgDefault, fontWeight: '600'},
});
