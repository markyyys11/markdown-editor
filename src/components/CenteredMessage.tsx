import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {fontSize, palette, spacing} from '../theme/theme';
import {Button} from './Button';

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
  return (
    <View style={styles.container}>
      {busy ? (
        <ActivityIndicator size="large" color={palette.accent} />
      ) : null}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    color: palette.fgDefault,
    fontSize: fontSize.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: palette.fgMuted,
    fontSize: fontSize.body,
    lineHeight: 21,
    textAlign: 'center',
  },
  action: {marginTop: spacing.sm},
});
