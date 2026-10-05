import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, TextInput, View} from 'react-native';
import {fontSize, palette, radius, spacing} from '../theme/theme';
import {Button} from './Button';

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
      onRequestClose={onCancel}>
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
            selectionColor={palette.accent}
            placeholderTextColor={palette.fgSubtle}
            style={[styles.input, multiline ? styles.inputMultiline : null]}
          />
          {error !== null ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            <Button
              label="Отмена"
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 4, 9, 0.78)',
    paddingHorizontal: spacing.lg,
    paddingTop: '22%',
  },
  card: {
    backgroundColor: palette.canvasSubtle,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: palette.fgDefault,
    fontSize: fontSize.title,
    fontWeight: '600',
  },
  description: {
    color: palette.fgMuted,
    fontSize: fontSize.label,
    lineHeight: 19,
  },
  label: {
    color: palette.fgMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: palette.fgDefault,
    backgroundColor: palette.canvasDefault,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.sm,
    fontSize: fontSize.body,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    color: palette.red,
    fontSize: fontSize.label,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {flex: 1},
});
