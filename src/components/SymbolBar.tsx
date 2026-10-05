import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MARKDOWN_SYMBOLS} from '../markdown/symbols';
import type {MarkdownSymbol} from '../markdown/symbols';
import {fontSize, monoFontStack, palette, radius, spacing} from '../theme/theme';

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
export function SymbolBar({onInsert, bottomInset}: Props) {
  return (
    <View
      style={[
        styles.bar,
        {height: SYMBOL_BAR_HEIGHT + bottomInset, paddingBottom: bottomInset},
      ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Without this the first tap only dismisses the keyboard and the key
        // appears to do nothing.
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.row}>
        {MARKDOWN_SYMBOLS.map(symbol => (
          <Pressable
            key={symbol.symbol}
            accessibilityRole="button"
            accessibilityLabel={symbol.label}
            onPress={() => onInsert(symbol)}
            android_ripple={{color: palette.borderDefault}}
            style={({pressed}) => [
              styles.key,
              pressed ? styles.keyPressed : null,
            ]}>
            <Text style={styles.keyLabel}>{symbol.symbol}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.canvasSubtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.borderDefault,
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
    backgroundColor: palette.canvasDefault,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  keyPressed: {backgroundColor: palette.borderMuted},
  keyLabel: {
    color: palette.fgDefault,
    fontFamily: monoFontStack,
    fontSize: fontSize.body,
  },
});
