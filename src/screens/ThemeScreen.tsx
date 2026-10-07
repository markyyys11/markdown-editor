import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ThemeList } from '../components/ThemeList';
import { useThemePicker } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

type Props = {
  onBack(): void;
};

/** Every theme the app ships, applied as soon as one is tapped. */
export function ThemeScreen({ onBack }: Props) {
  const { theme } = useThemePicker();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Theme"
        subtitle={theme.label}
        onBack={onBack}
        actions={[
          {
            label: theme.mode === 'dark' ? 'dark' : 'light',
            onPress: () => {},
            disabled: true,
          },
        ]}
      />
      <ThemeList />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
  });
