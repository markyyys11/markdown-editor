import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize, monoFontStack, spacing } from '../theme/theme';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

export type HeaderAction = {
  label: string;
  onPress(): void;
  disabled?: boolean;
  /** Renders the action in the accent colour, for the primary one. */
  emphasis?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  onBack?(): void;
  actions?: ReadonlyArray<HeaderAction>;
};

/**
 * The one header every screen uses. It carries the top safe-area inset because
 * the app draws edge to edge — Android 15 and later enforce that for apps
 * targeting API 35+, whatever `edgeToEdgeEnabled` says.
 */
export function ScreenHeader({ title, subtitle, onBack, actions = [] }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onBack !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backLabel}>‹ Back</Text>
          </Pressable>
        ) : null}
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions.map(action => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityState={{ disabled: action.disabled === true }}
            disabled={action.disabled === true}
            hitSlop={10}
            onPress={action.onPress}
            style={styles.action}
          >
            <Text
              style={[
                styles.actionLabel,
                action.emphasis === true ? styles.actionEmphasis : null,
                action.disabled === true ? styles.actionDisabled : null,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.ui.canvasSubtle,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderDefault,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 40,
    },
    back: { paddingVertical: spacing.xs, paddingRight: spacing.xs },
    backLabel: { color: theme.ui.accent, fontSize: fontSize.body },
    titles: { flex: 1 },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.title,
      fontWeight: '600',
    },
    subtitle: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.caption,
      fontFamily: monoFontStack,
      marginTop: 2,
    },
    action: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
    actionLabel: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.body,
      fontWeight: '600',
    },
    actionEmphasis: { color: theme.ui.accent },
    actionDisabled: { color: theme.ui.fgSubtle },
  });
