import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  label: string;
  initialValue: string;
  submitLabel: string;
  multiline?: boolean;
  busy?: boolean;
  error?: string | null;
  onCancel(): void;
  onSubmit(value: string): void;
};

/**
 * One dialog for both jobs that need text from the user: naming a new file and
 * writing a commit message.
 *
 * The card sits in the upper third rather than centred, so the soft keyboard —
 * which the dialog cannot rely on resizing it — never covers the field.
 */
export function PromptDialog({
  visible,
  title,
  description,
  label,
  initialValue,
  submitLabel,
  multiline = false,
  busy = false,
  error = null,
  onCancel,
  onSubmit,
}: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [visible, initialValue]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {description !== undefined ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            multiline={multiline}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            selectionColor={theme.ui.accent}
            placeholderTextColor={theme.ui.fgSubtle}
            style={[styles.input, multiline ? styles.inputMultiline : null]}
          />
          {error !== null ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Button
              label="Cancel"
              variant="secondary"
              onPress={onCancel}
              style={styles.button}
            />
            <Button
              label={submitLabel}
              busy={busy}
              disabled={value.trim().length === 0}
              onPress={() => onSubmit(value)}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      // Fixed dark scrim: it has to separate the dialog from the document
      // whatever the theme, including a light one.
      backgroundColor: 'rgba(1, 4, 9, 0.78)',
      paddingHorizontal: spacing.lg,
      paddingTop: '22%',
    },
    card: {
      backgroundColor: theme.ui.canvasSubtle,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.title,
      fontWeight: '600',
    },
    description: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.label,
      lineHeight: 19,
    },
    label: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.caption,
      marginTop: spacing.sm,
    },
    input: {
      minHeight: 42,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: theme.ui.fgDefault,
      backgroundColor: theme.ui.canvasDefault,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.sm,
      fontSize: fontSize.body,
    },
    inputMultiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    error: {
      color: theme.ui.danger,
      fontSize: fontSize.label,
    },
    buttons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    button: { flex: 1 },
  });
