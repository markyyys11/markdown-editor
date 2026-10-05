import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {fontSize, palette, radius, spacing} from '../theme/theme';

type Option<T extends string> = {value: T; label: string};

type Props<T extends string> = {
  value: T;
  options: ReadonlyArray<Option<T>>;
  onChange(value: T): void;
};

/** The edit/preview switch: one row, two states, no ambiguity. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{selected}}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected ? styles.selected : null]}>
            <Text
              style={[styles.label, selected ? styles.labelSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2,
    backgroundColor: palette.canvasDefault,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.md,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  selected: {backgroundColor: palette.canvasSubtle},
  label: {
    color: palette.fgMuted,
    fontSize: fontSize.label,
    fontWeight: '600',
  },
  labelSelected: {color: palette.fgDefault},
});
