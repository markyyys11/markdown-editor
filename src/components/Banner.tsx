import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

export type BannerKind = 'error' | 'success' | 'info';

type Props = {
  kind: BannerKind;
  message: string;
  actionLabel?: string;
  onAction?(): void;
};

const accentOf = (theme: AppTheme, kind: BannerKind): string => {
  switch (kind) {
    case 'error':
      return theme.ui.danger;
    case 'success':
      return theme.ui.success;
    case 'info':
      return theme.ui.accent;
  }
};

/**
 * Inline status text. Deliberately not a toast: a commit that failed must stay
 * on screen until it is dealt with, not disappear after two seconds.
 */
export function Banner({ kind, message, actionLabel, onAction }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const accent = accentOf(theme, kind);

  return (
    <View style={[styles.container, { borderLeftColor: accent }]}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          style={styles.action}
        >
          <Text style={[styles.actionLabel, { color: accent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: theme.ui.canvasSubtle,
      borderLeftWidth: 3,
      borderRadius: radius.sm,
    },
    message: {
      flex: 1,
      color: theme.ui.fgDefault,
      fontSize: fontSize.label,
      lineHeight: 18,
    },
    action: { paddingVertical: spacing.xs },
    actionLabel: {
      fontSize: fontSize.label,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });
