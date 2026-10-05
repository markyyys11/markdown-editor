import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {fontSize, monoFontStack, palette, spacing} from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Right-aligned hint, usually a date. */
  trailing?: string;
  /** Rows that cannot be opened are shown, but greyed out. */
  disabled?: boolean;
  onPress?(): void;
};

export function ListRow({
  title,
  subtitle,
  trailing,
  disabled = false,
  onPress,
}: Props) {
  const content = (
    <>
      <View style={styles.text}>
        <Text style={[styles.title, disabled ? styles.muted : null]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing !== undefined ? (
        <Text style={styles.trailing}>{trailing}</Text>
      ) : null}
    </>
  );

  if (disabled || onPress === undefined) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      android_ripple={{color: palette.canvasSubtle}}
      style={({pressed}) => [styles.row, pressed ? styles.pressed : null]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 54,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.borderMuted,
  },
  pressed: {backgroundColor: palette.canvasSubtle},
  text: {flex: 1},
  title: {
    color: palette.fgDefault,
    fontSize: fontSize.body,
  },
  muted: {color: palette.fgSubtle},
  subtitle: {
    color: palette.fgMuted,
    fontSize: fontSize.caption,
    fontFamily: monoFontStack,
    marginTop: 2,
  },
  trailing: {
    color: palette.fgSubtle,
    fontSize: fontSize.caption,
  },
});
