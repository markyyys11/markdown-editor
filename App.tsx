import React from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CenteredMessage} from './src/components/CenteredMessage';
import {AppNavigator} from './src/navigation/AppNavigator';
import {TokenScreen} from './src/screens/TokenScreen';
import {AuthProvider, useAuth} from './src/state/AuthContext';
import {palette} from './src/theme/theme';

function Root() {
  const {status} = useAuth();
  if (status === 'loading') {
    return <CenteredMessage title="Подключение к GitHub" busy />;
  }
  if (status === 'signedOut') {
    return <TokenScreen />;
  }
  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={palette.canvasSubtle} />
      <AuthProvider>
        <View style={styles.root}>
          <Root />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvasDefault},
});
