import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MARKDOWN_SYMBOLS } from '../markdown/symbols';
import type { MarkdownSymbol } from '../markdown/symbols';
import { fontSize, monoFontStack, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

/** Deliberately short: the panel must not eat the editing area. */
export const SYMBOL_BAR_HEIGHT = 44;

type Props = {
  onInsert(symbol: MarkdownSymbol): void;
  /** Bottom padding, for the navigation bar when the keyboard is down. */
  bottomInset: number;
};

/**
 * The sticky strip of Markdown characters.
 *
 * It scrolls sideways rather than wrapping, because eighteen keys do not fit
 * across a phone and a second row would cost height the editor needs.
 */
export function SymbolBar({ onInsert, bottomInset }: Props) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.bar,
        { height: SYMBOL_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Without this the first tap only dismisses the keyboard and the key
        // appears to do nothing.
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.row}
      >
        {MARKDOWN_SYMBOLS.map(symbol => (
          <Pressable
            key={symbol.symbol}
            accessibilityRole="button"
            accessibilityLabel={symbol.label}
            onPress={() => onInsert(symbol)}
            android_ripple={{ color: theme.ui.borderDefault }}
            style={({ pressed }) => [
              styles.key,
              pressed ? styles.keyPressed : null,
            ]}
          >
            <Text style={styles.keyLabel}>{symbol.symbol}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    bar: {
      backgroundColor: theme.ui.canvasSubtle,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.ui.borderDefault,
    },
    row: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    key: {
      minWidth: 34,
      height: 30,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.ui.canvasDefault,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    keyPressed: { backgroundColor: theme.ui.borderMuted },
    keyLabel: {
      color: theme.ui.fgDefault,
      fontFamily: monoFontStack,
      fontSize: fontSize.body,
    },
  });
