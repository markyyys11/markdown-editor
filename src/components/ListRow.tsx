import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, monoFontStack, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

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
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const content = (
    <>
      <View style={styles.text}>
        <Text
          style={[styles.title, disabled ? styles.muted : null]}
          numberOfLines={1}
        >
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
      android_ripple={{ color: theme.ui.canvasSubtle }}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 54,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderMuted,
    },
    pressed: { backgroundColor: theme.ui.canvasSubtle },
    text: { flex: 1 },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.body,
    },
    muted: { color: theme.ui.fgSubtle },
    subtitle: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.caption,
      fontFamily: monoFontStack,
      marginTop: 2,
    },
    trailing: {
      color: theme.ui.fgSubtle,
      fontSize: fontSize.caption,
    },
  });
