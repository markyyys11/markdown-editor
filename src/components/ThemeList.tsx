import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fontSize, monoFontStack, radius, spacing } from '../theme/theme';
import { useThemePicker } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

type Props = {
  /** Called after a theme is chosen, so a host can close itself. */
  onPicked?(id: string): void;
};

/** The colours that say most about a theme at a glance. */
const swatchOf = (theme: AppTheme): string[] => [
  theme.ui.canvasSubtle,
  theme.ui.accent,
  theme.markup.heading,
  theme.markup.bold,
  theme.markup.italic,
  theme.markup.inlineCode,
];

function ThemeRow({
  theme,
  active,
  onPress,
}: {
  theme: AppTheme;
  active: boolean;
  onPress(): void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={theme.label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        active ? styles.rowActive : null,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowText}>
        <Text style={styles.label} numberOfLines={1}>
          {theme.label}
        </Text>
        <Text style={styles.mode}>
          {theme.mode === 'dark' ? 'dark' : 'light'}
        </Text>
      </View>
      <View style={styles.swatch}>
        {swatchOf(theme).map((color, index) => (
          <View
            key={`${color}-${index}`}
            style={[styles.swatchChip, { backgroundColor: color }]}
          />
        ))}
      </View>
      {active ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
}

/**
 * The list of themes, shared by the theme screen and the editor's sheet.
 *
 * It keeps its own filter: sixty-five themes is too many to scroll through, and
 * the labels are what the user recognises them by.
 */
export function ThemeList({ onPicked }: Props) {
  const { theme: active, themes, selectTheme } = useThemePicker();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return themes;
    }
    return themes.filter(theme => theme.label.toLowerCase().includes(needle));
  }, [query, themes]);

  return (
    <>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search themes"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        clearButtonMode="while-editing"
        style={styles.filter}
      />
      <FlatList
        data={shown}
        keyExtractor={theme => theme.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ThemeRow
            theme={item}
            active={item.id === active.id}
            onPress={() => {
              selectTheme(item.id);
              onPicked?.(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No theme matches “{query}”</Text>
        }
      />
    </>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    filter: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      minHeight: 40,
      paddingHorizontal: spacing.md,
      color: theme.ui.fgDefault,
      backgroundColor: theme.ui.canvasDefault,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.sm,
      fontSize: fontSize.body,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderMuted,
    },
    rowActive: { backgroundColor: theme.ui.canvasSubtle },
    rowPressed: { backgroundColor: theme.ui.canvasInset },
    rowText: { flex: 1 },
    label: { color: theme.ui.fgDefault, fontSize: fontSize.body },
    mode: {
      color: theme.ui.fgSubtle,
      fontSize: fontSize.caption,
      fontFamily: monoFontStack,
    },
    swatch: { flexDirection: 'row' },
    swatchChip: {
      width: 12,
      height: 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.ui.borderDefault,
    },
    check: {
      color: theme.ui.accent,
      fontSize: fontSize.title,
      fontWeight: '600',
    },
    empty: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.label,
      padding: spacing.lg,
      textAlign: 'center',
    },
  });
