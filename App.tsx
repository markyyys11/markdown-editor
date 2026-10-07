import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CenteredMessage } from './src/components/CenteredMessage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { TokenScreen } from './src/screens/TokenScreen';
import { AuthProvider, useAuth } from './src/state/AuthContext';
import { ThemeProvider, useTheme } from './src/themes/ThemeProvider';
import type { AppTheme } from './src/themes/types';
import { useThemedStyles } from './src/themes/useThemedStyles';

function Root() {
  const { status } = useAuth();
  if (status === 'loading') {
    return <CenteredMessage title="Connecting to GitHub" busy />;
  }
  if (status === 'signedOut') {
    return <TokenScreen />;
  }
  return <AppNavigator />;
}

/** Keeps the system bars in step with the theme, which may be a light one. */
function ThemedStatusBar() {
  const theme = useTheme();
  return (
    <StatusBar
      barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={theme.ui.canvasSubtle}
    />
  );
}

function ThemedRoot() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.root}>
      <Root />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <AuthProvider>
          <ThemedRoot />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
  });
