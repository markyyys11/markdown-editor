import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fontSize, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';
import { Button } from './Button';

type Props = {
  title: string;
  description?: string;
  busy?: boolean;
  actionLabel?: string;
  onAction?(): void;
};

/** The single look for "loading", "nothing here" and "that failed". */
export function CenteredMessage({
  title,
  description,
  busy = false,
  actionLabel,
  onAction,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {busy ? <ActivityIndicator size="large" color={theme.ui.accent} /> : null}
      <Text style={styles.title}>{title}</Text>
      {description !== undefined ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button
          label={actionLabel}
          variant="secondary"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.title,
      fontWeight: '600',
      textAlign: 'center',
    },
    description: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.body,
      lineHeight: 21,
      textAlign: 'center',
    },
    action: { marginTop: spacing.sm },
  });
