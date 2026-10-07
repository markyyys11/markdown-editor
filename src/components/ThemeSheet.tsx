import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, radius, spacing } from '../theme/theme';
import { useThemedStyles } from '../themes/useThemedStyles';
import type { AppTheme } from '../themes/types';
import { ThemeList } from './ThemeList';

type Props = {
  visible: boolean;
  onClose(): void;
};

/**
 * The theme list as a sheet over the editor.
 *
 * It covers only the lower part of the screen on purpose: choosing a theme is
 * worth doing while looking at your own document, and the change is visible
 * immediately above the sheet.
 */
export function ThemeSheet({ visible, onClose }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.scrim}
          accessibilityLabel="Close the theme list"
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Theme</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
          <ThemeList />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end' },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(1, 4, 9, 0.45)',
    },
    sheet: {
      height: '62%',
      backgroundColor: theme.ui.canvasSubtle,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      borderTopWidth: 1,
      borderColor: theme.ui.borderDefault,
      paddingTop: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderDefault,
      marginBottom: spacing.md,
    },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.title,
      fontWeight: '600',
    },
    done: {
      color: theme.ui.accent,
      fontSize: fontSize.body,
      fontWeight: '600',
    },
  });
