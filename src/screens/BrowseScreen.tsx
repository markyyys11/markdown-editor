import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Banner } from '../components/Banner';
import { CenteredMessage } from '../components/CenteredMessage';
import { Chip } from '../components/Chip';
import { ListRow } from '../components/ListRow';
import { PromptDialog } from '../components/PromptDialog';
import { ScreenHeader } from '../components/ScreenHeader';
import { GitHubError } from '../github/client';
import { baseName, isMarkdownPath, joinRepoPath } from '../github/paths';
import type { DirEntry, RepoSummary } from '../github/types';
import type { OpenedFile } from '../navigation/routes';
import { useGitHub } from '../state/AuthContext';
import { fontSize, spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';

type Props = {
  repo: RepoSummary;
  path: string;
  onBack(): void;
  onOpenDirectory(path: string): void;
  onOpenFile(file: OpenedFile): void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

/** Browses one directory of a repository at one branch. */
export function BrowseScreen({
  repo,
  path,
  onBack,
  onOpenDirectory,
  onOpenFile,
}: Props) {
  const client = useGitHub();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [branch, setBranch] = useState(repo.defaultBranch);
  const [entries, setEntries] = useState<DirEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [onlyMarkdown, setOnlyMarkdown] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [branches, setBranches] = useState<string[] | null>(null);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileError, setNewFileError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEntries(
        await client.listDirectory(repo.owner, repo.name, path, branch),
      );
    } catch (failure) {
      setEntries(null);
      setError(
        failure instanceof GitHubError
          ? failure.message
          : 'Could not read the directory.',
      );
    }
  }, [branch, client, path, repo.name, repo.owner]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    setReloading(true);
    void load().finally(() => setReloading(false));
  }, [load]);

  const openBranchPicker = useCallback(() => {
    setPickerOpen(true);
    if (branches === null) {
      client
        .listBranches(repo.owner, repo.name)
        .then(setBranches)
        .catch(() => {
          // Falling back to the default branch still lets the user work.
          setBranches([repo.defaultBranch]);
        });
    }
  }, [branches, client, repo.defaultBranch, repo.name, repo.owner]);

  const listed = useMemo(() => {
    const all = entries ?? [];
    const filtered = onlyMarkdown
      ? all.filter(entry => entry.type === 'dir' || isMarkdownPath(entry.path))
      : all;
    return [...filtered].sort((left, right) => {
      const leftGroup = left.type === 'dir' ? 0 : 1;
      const rightGroup = right.type === 'dir' ? 0 : 1;
      return leftGroup !== rightGroup
        ? leftGroup - rightGroup
        : left.name.localeCompare(right.name, 'en');
    });
  }, [entries, onlyMarkdown]);

  const takenNames = useMemo(
    () => new Set((entries ?? []).map(entry => entry.name.toLowerCase())),
    [entries],
  );

  const submitNewFile = useCallback(
    (rawName: string) => {
      const name = rawName.trim();
      if (name.length === 0) {
        return;
      }
      const fileName = isMarkdownPath(name) ? name : `${name}.md`;
      if (takenNames.has(fileName.toLowerCase())) {
        setNewFileError('A file with that name already exists in this folder.');
        return;
      }
      setNewFileOpen(false);
      setNewFileError(null);
      onOpenFile({ path: joinRepoPath(path, fileName), isNew: true, branch });
    },
    [branch, onOpenFile, path, takenNames],
  );

  const body = (() => {
    if (entries === null && error === null) {
      return <CenteredMessage title="Reading the directory" busy />;
    }
    if (entries === null) {
      return (
        <CenteredMessage
          title="Could not read the directory"
          description={error ?? undefined}
          actionLabel="Retry"
          onAction={reload}
        />
      );
    }
    return (
      <FlatList
        data={listed}
        keyExtractor={entry => `${entry.type}:${entry.path}`}
        renderItem={({ item }) => {
          if (item.type === 'dir') {
            return (
              <ListRow
                title={`${item.name}/`}
                onPress={() => onOpenDirectory(item.path)}
              />
            );
          }
          const markdown = isMarkdownPath(item.path);
          return (
            <ListRow
              title={item.name}
              trailing={formatSize(item.size)}
              disabled={!markdown}
              onPress={
                markdown
                  ? () => onOpenFile({ path: item.path, isNew: false, branch })
                  : undefined
              }
            />
          );
        }}
        contentContainerStyle={listed.length === 0 ? styles.empty : undefined}
        refreshControl={
          <RefreshControl
            refreshing={reloading}
            onRefresh={reload}
            colors={[theme.ui.accent]}
            progressBackgroundColor={theme.ui.canvasSubtle}
          />
        }
        ListEmptyComponent={
          <CenteredMessage
            title="Empty"
            description={
              onlyMarkdown
                ? 'This folder has neither subfolders nor Markdown files.'
                : 'This folder is empty.'
            }
          />
        }
      />
    );
  })();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={path.length === 0 ? repo.name : baseName(path)}
        subtitle={repo.fullName}
        onBack={onBack}
        actions={[
          {
            label: '+ File',
            emphasis: true,
            onPress: () => {
              setNewFileError(null);
              setNewFileOpen(true);
            },
          },
        ]}
      />
      <View style={styles.toolbar}>
        <Chip label={`Branch: ${branch}`} onPress={openBranchPicker} />
        <Chip
          label="Markdown only"
          selected={onlyMarkdown}
          onPress={() => setOnlyMarkdown(current => !current)}
        />
      </View>
      {error !== null && entries !== null ? (
        <Banner
          kind="error"
          message={error}
          actionLabel="Retry"
          onAction={reload}
        />
      ) : null}
      {body}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Branch</Text>
            {branches === null ? (
              <CenteredMessage title="Loading branches" busy />
            ) : (
              <FlatList
                data={branches}
                keyExtractor={name => name}
                renderItem={({ item }) => (
                  <ListRow
                    title={item}
                    trailing={item === branch ? 'selected' : undefined}
                    onPress={() => {
                      setBranch(item);
                      setPickerOpen(false);
                    }}
                  />
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <PromptDialog
        visible={newFileOpen}
        title="New document"
        description={
          path.length === 0 ? repo.fullName : `${repo.fullName}/${path}`
        }
        label="File name"
        initialValue=""
        submitLabel="Create"
        error={newFileError}
        onCancel={() => {
          setNewFileOpen(false);
          setNewFileError(null);
        }}
        onSubmit={submitNewFile}
      />
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
    toolbar: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderMuted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(1, 4, 9, 0.78)',
      paddingTop: '18%',
      paddingHorizontal: spacing.lg,
    },
    sheet: {
      flex: 1,
      maxHeight: '70%',
      backgroundColor: theme.ui.canvasSubtle,
      borderWidth: 1,
      borderColor: theme.ui.borderDefault,
      borderRadius: 12,
      overflow: 'hidden',
    },
    sheetTitle: {
      color: theme.ui.fgDefault,
      fontSize: fontSize.title,
      fontWeight: '600',
      padding: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.ui.borderDefault,
    },
    empty: { flexGrow: 1 },
  });
