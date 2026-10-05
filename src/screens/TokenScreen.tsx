import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Button} from '../components/Button';
import {GitHubError} from '../github/client';
import {useAuth} from '../state/AuthContext';
import {fontSize, monoFontStack, palette, radius, spacing} from '../theme/theme';
import {openExternalUrl} from '../util/urls';

const TOKEN_SETTINGS_URL = 'https://github.com/settings/tokens';

/**
 * The signed-out screen: it explains why a personal access token is needed and
 * validates one before it is stored.
 */
export function TokenScreen() {
  const {signIn} = useAuth();
  const insets = useSafeAreaInsets();
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
            : 'Не удалось проверить токен. Попробуйте ещё раз.',
        );
      })
      .finally(() => setBusy(false));
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl},
      ]}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Markdown Editor</Text>
      <Text style={styles.lead}>
        Правка Markdown-документов прямо в репозиториях GitHub: исходник с
        подсветкой синтаксиса, просмотр как на github.com и коммит с телефона.
      </Text>

      <Text style={styles.label}>Личный токен доступа</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="ghp_…"
        placeholderTextColor={palette.fgSubtle}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        selectionColor={palette.accent}
        returnKeyType="go"
        onSubmitEditing={submit}
        style={styles.input}
      />
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label="Войти"
        onPress={submit}
        busy={busy}
        disabled={trimmed.length === 0}
        style={styles.submit}
      />

      <View style={styles.help}>
        <Text style={styles.helpTitle}>Как получить токен</Text>
        <Text style={styles.helpText}>
          1. Откройте настройки токенов GitHub и создайте новый токен.
        </Text>
        <Text style={styles.helpText}>
          2. Классическому токену достаточно области{' '}
          <Text style={styles.code}>repo</Text>; токену с тонкими правами —
          разрешение <Text style={styles.code}>Contents: Read and write</Text>.
        </Text>
        <Text style={styles.helpText}>
          3. Скопируйте токен и вставьте его в поле выше.
        </Text>
        <Button
          label="Открыть настройки GitHub"
          variant="secondary"
          onPress={() => {
            void openExternalUrl(TOKEN_SETTINGS_URL);
          }}
          style={styles.helpButton}
        />
      </View>

      <Text style={styles.footnote}>
        Токен сохраняется в защищённом хранилище Android (Keystore) и
        используется только для запросов к api.github.com.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvasDefault},
  content: {paddingHorizontal: spacing.lg, gap: spacing.sm},
  title: {
    color: palette.fgDefault,
    fontSize: fontSize.hero,
    fontWeight: '700',
  },
  lead: {
    color: palette.fgMuted,
    fontSize: fontSize.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  label: {
    color: palette.fgMuted,
    fontSize: fontSize.caption,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    color: palette.fgDefault,
    backgroundColor: palette.canvasSubtle,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.sm,
    fontSize: fontSize.body,
  },
  error: {color: palette.red, fontSize: fontSize.label, lineHeight: 19},
  submit: {marginTop: spacing.sm},
  help: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: palette.canvasSubtle,
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  helpTitle: {
    color: palette.fgDefault,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  helpText: {color: palette.fgMuted, fontSize: fontSize.label, lineHeight: 20},
  code: {fontFamily: monoFontStack, color: palette.lightBlue},
  helpButton: {marginTop: spacing.sm},
  footnote: {
    marginTop: spacing.lg,
    color: palette.fgSubtle,
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
