import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import type {DocumentMode} from '../../shared/protocol';
import {Banner} from '../components/Banner';
import type {BannerKind} from '../components/Banner';
import {Button} from '../components/Button';
import {CenteredMessage} from '../components/CenteredMessage';
import {PromptDialog} from '../components/PromptDialog';
import {ScreenHeader} from '../components/ScreenHeader';
import {SegmentedControl} from '../components/SegmentedControl';
import {GitHubError} from '../github/client';
import {resolveLink} from '../github/links';
import {baseName} from '../github/paths';
import type {RepoSummary, WriteFileInput} from '../github/types';
import {
  confirmDiscard,
  useUnsavedChangesGuard,
} from '../navigation/useUnsavedChangesGuard';
import {useGitHub} from '../state/AuthContext';
import {palette, spacing} from '../theme/theme';
import {openExternalUrl} from '../util/urls';
import {MarkdownWebView} from '../webview/MarkdownWebView';
import type {MarkdownWebViewHandle} from '../webview/MarkdownWebView';

const MODES: ReadonlyArray<{value: DocumentMode; label: string}> = [
  {value: 'edit', label: 'Правка'},
  {value: 'preview', label: 'Просмотр'},
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
  const webView = useRef<MarkdownWebViewHandle>(null);
  const loadedOnce = useRef(false);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    isNew ? 'ready' : 'loading',
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [baseline, setBaseline] = useState('');
  const [sha, setSha] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<DocumentMode>('edit');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [commitOpen, setCommitOpen] = useState(false);
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
        message: 'Новый файл. Он появится в репозитории после первого коммита.',
      });
      webView.current?.setDocument('');
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
      webView.current?.setDocument(file.text);
    } catch (failure) {
      const message =
        failure instanceof GitHubError
          ? failure.message
          : 'Не удалось открыть файл.';
      if (loadedOnce.current) {
        // The editor is already usable; a failed refresh must not tear it down.
        setNotice({kind: 'error', message});
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
        setNotice({kind: 'info', message: 'В файле нет изменений.'});
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
              ? `Коммит ${nextSha.slice(0, 7)} создан в ветке ${branch}.`
              : `Коммит создан в ветке ${branch}.`,
        });
      } catch (failure) {
        const error = failure instanceof GitHubError ? failure : null;
        const text = error?.message ?? 'Не удалось создать коммит.';
        if (error !== null && error.kind === 'conflict') {
          // Close the dialog so the reload action below is reachable.
          setCommitOpen(false);
          setNotice({
            kind: 'error',
            message: text,
            actionLabel: 'Перезагрузить файл',
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
    <View style={styles.root}>
      <ScreenHeader
        title={baseName(path)}
        subtitle={`${repo.fullName} · ${branch}`}
        onBack={leave}
        actions={[
          {
            label: dirty ? 'Коммит •' : 'Коммит',
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
            label="Отменить"
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
        <CenteredMessage title="Открытие файла" busy />
      ) : null}
      {status === 'error' ? (
        <CenteredMessage
          title="Не удалось открыть файл"
          description={loadError ?? undefined}
          actionLabel="Повторить"
          onAction={() => {
            void load();
          }}
        />
      ) : null}
      {status === 'ready' ? (
        <MarkdownWebView
          ref={webView}
          mode={mode}
          onChangeText={handleChangeText}
          onOpenLink={handleOpenLink}
          onError={message => setNotice({kind: 'error', message})}
        />
      ) : null}

      <PromptDialog
        visible={commitOpen}
        title="Коммит"
        description={`${repo.fullName} · ${branch}`}
        label="Сообщение коммита"
        initialValue={isNew ? `Create ${path}` : `Update ${path}`}
        submitLabel="Закоммитить"
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

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvasDefault},
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.borderMuted,
  },
  discard: {paddingHorizontal: spacing.md},
  notice: {paddingTop: spacing.md},
});
