import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {fontSize, palette, radius, spacing} from '../theme/theme';

export type BannerKind = 'error' | 'success' | 'info';

type Props = {
  kind: BannerKind;
  message: string;
  actionLabel?: string;
  onAction?(): void;
};

const ACCENTS: Record<BannerKind, string> = {
  error: palette.red,
  success: palette.green,
  info: palette.accent,
};

/**
 * Inline status text. Deliberately not a toast: a commit that failed must stay
 * on screen until it is dealt with, not disappear after two seconds.
 */
export function Banner({kind, message, actionLabel, onAction}: Props) {
  const accent = ACCENTS[kind];
  return (
    <View style={[styles.container, {borderLeftColor: accent}]}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          style={styles.action}>
          <Text style={[styles.actionLabel, {color: accent}]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.canvasSubtle,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
  },
  message: {
    flex: 1,
    color: palette.fgDefault,
    fontSize: fontSize.label,
    lineHeight: 18,
  },
  action: {paddingVertical: spacing.xs},
  actionLabel: {
    fontSize: fontSize.label,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
