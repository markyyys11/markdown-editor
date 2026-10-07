import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { GitHubError } from '../github/client';
import { useAuth } from '../state/AuthContext';
import { fontSize, monoFontStack, radius, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';
import { openExternalUrl } from '../util/urls';

const TOKEN_SETTINGS_URL = 'https://github.com/settings/tokens';

/**
 * The signed-out screen: it explains why a personal access token is needed and
 * validates one before it is stored.
 */
export function TokenScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmed = token.trim();

  const submit = () => {
    if (trimmed.length === 0 || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    signIn(trimmed)
      .catch(failure => {
        setError(
          failure instanceof GitHubError
            ? failure.message
            : 'Could not verify the token. Try again.',
        );
      })
      .finally(() => setBusy(false));
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Markdown Editor</Text>
      <Text style={styles.lead}>
        Edit Markdown documents right inside GitHub repositories: the source
        with syntax highlighting, a rendered preview and committing from the
        phone.
      </Text>

      <Text style={styles.label}>Personal access token</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="ghp_…"
        placeholderTextColor={theme.ui.fgSubtle}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        selectionColor={theme.ui.accent}
        returnKeyType="go"
        onSubmitEditing={submit}
        style={styles.input}
      />
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Sign in"
        onPress={submit}
        busy={busy}
        disabled={trimmed.length === 0}
        style={styles.submit}
      />

      <View style={styles.help}>
        <Text style={styles.helpTitle}>How to get a token</Text>
        <Text style={styles.helpText}>
          1. Open the GitHub token settings and create a new token.
        </Text>
        <Text style={styles.helpText}>
          2. A classic token only needs the{' '}
          <Text style={styles.code}>repo</Text> scope; a fine-grained token
          needs the <Text style={styles.code}>Contents: Read and write</Text>{' '}
          permission.
        </Text>
        <Text style={styles.helpText}>
          3. Copy the token and paste it into the field above.
        </Text>
        <Button
          label="Open GitHub settings"
          variant="secondary"
          onPress={() => {
            void openExternalUrl(TOKEN_SETTINGS_URL);
          }}
          style={styles.helpButton}
        />
      </View>

      <Text style={styles.footnote}>
        The token is kept in the Android secure storage (Keystore) and is used
        only for requests to api.github.com.
      </Text>
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
    content: { paddingHorizontal: spacing.lg, gap: spacing.sm },
    title: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.hero,
      fontWeight: '700',
    },
    lead: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.body,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    label: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.caption,
      marginTop: spacing.sm,
    },
    input: {
      minHeight: 46,
      paddingHorizontal: spacing.md,
      color: theme.ui.fgDefault,
      backgroundColor: theme.ui.canvasSubtle,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.sm,
      fontSize: fontSize.body,
    },
    error: { color: theme.ui.danger, fontSize: fontSize.label, lineHeight: 19 },
    submit: { marginTop: spacing.sm },
    help: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      backgroundColor: theme.ui.canvasSubtle,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: radius.md,
      gap: spacing.sm,
    },
    helpTitle: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.body,
      fontWeight: '600',
    },
    helpText: {
      color: theme.ui.fgMuted,
      fontSize: fontSize.label,
      lineHeight: 20,
    },
    code: { fontFamily: monoFontStack, color: theme.markup.inlineCode },
    helpButton: { marginTop: spacing.sm },
    footnote: {
      marginTop: spacing.lg,
      color: theme.ui.fgSubtle,
      fontSize: fontSize.caption,
      lineHeight: 18,
    },
  });
