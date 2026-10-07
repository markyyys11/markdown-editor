import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DocumentMode, InsertRequest } from '../../shared/protocol';
import { Banner } from '../components/Banner';
import type { BannerKind } from '../components/Banner';
import { Button } from '../components/Button';
import { CenteredMessage } from '../components/CenteredMessage';
import { PromptDialog } from '../components/PromptDialog';
import { ScreenHeader } from '../components/ScreenHeader';
import { SegmentedControl } from '../components/SegmentedControl';
import { SymbolBar } from '../components/SymbolBar';
import { TabKey } from '../components/TabKey';
import { ThemeSheet } from '../components/ThemeSheet';
import { GitHubError } from '../github/client';
import { resolveLink } from '../github/links';
import { baseName } from '../github/paths';
import type { RepoSummary, WriteFileInput } from '../github/types';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { TAB_TEXT } from '../markdown/symbols';
import type { MarkdownSymbol } from '../markdown/symbols';
import {
  confirmDiscard,
  useUnsavedChangesGuard,
} from '../navigation/useUnsavedChangesGuard';
import { useGitHub } from '../state/AuthContext';
import { spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';
import { openExternalUrl } from '../util/urls';
import { MarkdownWebView } from '../webview/MarkdownWebView';
import type { MarkdownWebViewHandle } from '../webview/MarkdownWebView';

const MODES: ReadonlyArray<{ value: DocumentMode; label: string }> = [
  { value: 'edit', label: 'Edit' },
  { value: 'preview', label: 'Preview' },
];

type Notice = {
  kind: BannerKind;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type Props = {
  repo: RepoSummary;
  branch: string;
  path: string;
  isNew: boolean;
  onBack(): void;
  onOpenMarkdown(path: string): void;
};

export function EditorScreen({
  repo,
  branch,
  path,
  isNew,
  onBack,
  onOpenMarkdown,
}: Props) {
  const client = useGitHub();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const editor = useRef<MarkdownWebViewHandle | null>(null);
  const loadedOnce = useRef(false);
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardInset(insets.bottom);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    isNew ? 'ready' : 'loading',
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [baseline, setBaseline] = useState('');
  /** What the editor must display, plus a counter that forces a reload. */
  const [documentToLoad, setDocumentToLoad] = useState({ text: '', key: 0 });
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<DocumentMode>('edit');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [commitOpen, setCommitOpen] = useState(false);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    if (isNew) {
      loadedOnce.current = true;
      setContent('');
      setBaseline('');
      setSha(null);
      setDirty(false);
      setStatus('ready');
      setNotice({
        kind: 'info',
        message:
          'New file. It will appear in the repository after the first commit.',
      });
      setDocumentToLoad(current => ({ text: '', key: current.key + 1 }));
      return;
    }

    if (!loadedOnce.current) {
      setStatus('loading');
    }
    try {
      const file = await client.readFile(repo.owner, repo.name, path, branch);
      loadedOnce.current = true;
      setContent(file.text);
      setBaseline(file.text);
      setSha(file.sha);
      setDirty(false);
      setStatus('ready');
      setDocumentToLoad(current => ({ text: file.text, key: current.key + 1 }));
    } catch (failure) {
      const message =
        failure instanceof GitHubError
          ? failure.message
          : 'Could not open the file.';
      if (loadedOnce.current) {
        // The editor is already usable; a failed refresh must not tear it down.
        setNotice({ kind: 'error', message });
      } else {
        setLoadError(message);
        setStatus('error');
      }
    }
  }, [branch, client, isNew, path, repo.name, repo.owner]);

  useEffect(() => {
    void load();
  }, [load]);

  useUnsavedChangesGuard(dirty, onBack);

  const leave = useCallback(() => {
    if (dirty) {
      confirmDiscard(onBack);
      return;
    }
    onBack();
  }, [dirty, onBack]);

  const handleChangeText = useCallback((next: string) => {
    setContent(next);
    setDirty(true);
    setNotice(current =>
      current !== null && current.kind === 'success' ? null : current,
    );
  }, []);

  /**
   * The keypad only exists while the editor is mounted, so this ref is set by
   * the time a key can be tapped — the assumption the document could not make,
   * which is why it is passed as a prop instead.
   */
  const insert = useCallback((request: InsertRequest) => {
    editor.current?.insert(request);
  }, []);

  const insertSymbol = useCallback(
    (symbol: MarkdownSymbol) => {
      insert({ text: symbol.symbol, closer: symbol.closer });
    },
    [insert],
  );

  const insertTab = useCallback(() => {
    insert({ text: TAB_TEXT, closer: null });
  }, [insert]);

  const handleOpenLink = useCallback(
    (href: string) => {
      const resolved = resolveLink(
        href,
        path,
        `https://github.com/${repo.fullName}`,
        branch,
      );
      if (resolved.kind === 'external') {
        void openExternalUrl(resolved.url);
      } else if (resolved.kind === 'markdown') {
        onOpenMarkdown(resolved.path);
      }
    },
    [branch, onOpenMarkdown, path, repo.fullName],
  );

  const commit = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (trimmed.length === 0) {
        return;
      }
      if (sha !== null && content === baseline) {
        setDirty(false);
        setCommitOpen(false);
        setCommitError(null);
        setNotice({
          kind: 'info',
          message: 'There are no changes in the file.',
        });
        return;
      }

      setCommitting(true);
      setCommitError(null);
      try {
        const input: WriteFileInput = {
          owner: repo.owner,
          repo: repo.name,
          path,
          branch,
          message: trimmed,
          content,
        };
        if (sha !== null) {
          input.sha = sha;
        }
        const nextSha = await client.writeFile(input);
        if (nextSha.length > 0) {
          setSha(nextSha);
        }
        setBaseline(content);
        setDirty(false);
        setCommitOpen(false);
        setNotice({
          kind: 'success',
          message:
            nextSha.length > 0
              ? `Commit ${nextSha.slice(0, 7)} created on branch ${branch}.`
              : `Commit created on branch ${branch}.`,
        });
      } catch (failure) {
        const error = failure instanceof GitHubError ? failure : null;
        const text = error?.message ?? 'Could not create the commit.';
        if (error !== null && error.kind === 'conflict') {
          // Close the dialog so the reload action below is reachable.
          setCommitOpen(false);
          setNotice({
            kind: 'error',
            message: text,
            actionLabel: 'Reload file',
            onAction: () => {
              setNotice(null);
              confirmDiscard(() => {
                void load();
              });
            },
          });
        } else {
          setCommitError(text);
        }
      } finally {
        setCommitting(false);
      }
    },
    [baseline, branch, client, content, load, path, repo.name, repo.owner, sha],
  );

  const discardEdits = useCallback(() => {
    confirmDiscard(() => {
      void load();
    });
  }, [load]);

  return (
    <View
      // The padding is whatever the platform did not already take care of when
      // the keyboard appeared; see useKeyboardInset.
      style={[styles.root, { paddingBottom: keyboard.inset }]}
      onLayout={keyboard.onLayout}
    >
      <ScreenHeader
        title={baseName(path)}
        subtitle={`${repo.fullName} · ${branch}`}
        onBack={leave}
        actions={[
          {
            label: 'Theme',
            onPress: () => setThemeSheetOpen(true),
          },
          {
            label: dirty ? 'Commit •' : 'Commit',
            emphasis: dirty,
            disabled: !dirty,
            onPress: () => {
              setCommitError(null);
              setCommitOpen(true);
            },
          },
        ]}
      />

      <View style={styles.toolbar}>
        <SegmentedControl
          value={mode}
          options={MODES}
          onChange={next => setMode(next)}
        />
        {dirty ? (
          <Button
            label="Discard"
            variant="danger"
            onPress={discardEdits}
            style={styles.discard}
          />
        ) : null}
      </View>

      {notice !== null ? (
        <View style={styles.notice}>
          <Banner
            kind={notice.kind}
            message={notice.message}
            actionLabel={notice.actionLabel}
            onAction={notice.onAction}
          />
        </View>
      ) : null}

      {status === 'loading' ? (
        <CenteredMessage title="Opening file" busy />
      ) : null}
      {status === 'error' ? (
        <CenteredMessage
          title="Could not open the file"
          description={loadError ?? undefined}
          actionLabel="Retry"
          onAction={() => {
            void load();
          }}
        />
      ) : null}
      {status === 'ready' ? (
        <View style={styles.editor}>
          <MarkdownWebView
            ref={editor}
            document={documentToLoad.text}
            documentKey={documentToLoad.key}
            mode={mode}
            theme={theme}
            onChangeText={handleChangeText}
            onOpenLink={handleOpenLink}
            onError={message => setNotice({ kind: 'error', message })}
          />
          {/* Floating inside the editing area, so it sits just above the
              symbol bar without taking a row of its own. */}
          {mode === 'edit' ? <TabKey onPress={insertTab} /> : null}
        </View>
      ) : null}

      {/* Preview has no caret to insert into, so the keypad is editing-only. */}
      {status === 'ready' && mode === 'edit' ? (
        <SymbolBar
          onInsert={insertSymbol}
          bottomInset={
            keyboard.visible ? spacing.xs : Math.max(insets.bottom, spacing.sm)
          }
        />
      ) : null}

      <ThemeSheet
        visible={themeSheetOpen}
        onClose={() => setThemeSheetOpen(false)}
      />

      <PromptDialog
        visible={commitOpen}
        title="Commit"
        description={`${repo.fullName} · ${branch}`}
        label="Commit message"
        initialValue={isNew ? `Create ${path}` : `Update ${path}`}
        submitLabel="Commit"
        multiline
        busy={committing}
        error={commitError}
        onCancel={() => {
          setCommitOpen(false);
          setCommitError(null);
        }}
        onSubmit={value => {
          void commit(value);
        }}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
    editor: { flex: 1 },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderMuted,
    },
    discard: { paddingHorizontal: spacing.md },
    notice: { paddingTop: spacing.md },
  });
