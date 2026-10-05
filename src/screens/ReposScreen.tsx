import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { CenteredMessage } from '../components/CenteredMessage';
import { ListRow } from '../components/ListRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { GitHubError, REPOS_PAGE_SIZE } from '../github/client';
import type { RepoSummary } from '../github/types';
import { useAuth, useGitHub } from '../state/AuthContext';
import { spacing } from '../theme/theme';
import { useTheme } from '../themes/ThemeProvider';
import type { AppTheme } from '../themes/types';
import { useThemedStyles } from '../themes/useThemedStyles';
import { formatDay } from '../util/dates';

type Props = {
  onOpenRepo(repo: RepoSummary): void;
  onOpenThemes(): void;
};

export function ReposScreen({ onOpenRepo, onOpenThemes }: Props) {
  const client = useGitHub();
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mayHaveMore, setMayHaveMore] = useState(false);

  const load = useCallback(
    async (page: number) => {
      setError(null);
      try {
        const batch = await client.listRepos(page);
        setRepos(current => (page === 1 ? batch : [...current, ...batch]));
        setMayHaveMore(batch.length === REPOS_PAGE_SIZE);
        setStatus('ready');
      } catch (failure) {
        setError(
          failure instanceof GitHubError
            ? failure.message
            : 'Не удалось загрузить репозитории.',
        );
        setStatus(current => (current === 'loading' ? 'error' : current));
      }
    },
    [client],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load(1).finally(() => setRefreshing(false));
  }, [load]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    void load(Math.floor(repos.length / REPOS_PAGE_SIZE) + 1).finally(() =>
      setLoadingMore(false),
    );
  }, [load, repos.length]);

  const body = (() => {
    if (status === 'loading') {
      return <CenteredMessage title="Загрузка репозиториев" busy />;
    }
    if (status === 'error') {
      return (
        <CenteredMessage
          title="Не удалось загрузить"
          description={error ?? undefined}
          actionLabel="Повторить"
          onAction={refresh}
        />
      );
    }
    return (
      <FlatList
        data={repos}
        keyExtractor={repo => String(repo.id)}
        renderItem={({ item }) => (
          <ListRow
            title={item.isPrivate ? `${item.name} · приватный` : item.name}
            subtitle={item.fullName}
            trailing={formatDay(item.updatedAt)}
            onPress={() => onOpenRepo(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[theme.ui.accent]}
            progressBackgroundColor={theme.ui.canvasSubtle}
          />
        }
        contentContainerStyle={repos.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <CenteredMessage
            title="Репозиториев нет"
            description="У токена нет доступа ни к одному репозиторию."
          />
        }
        ListFooterComponent={
          mayHaveMore ? (
            <Button
              label="Показать ещё"
              variant="secondary"
              busy={loadingMore}
              onPress={loadMore}
              style={styles.more}
            />
          ) : null
        }
      />
    );
  })();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Репозитории"
        subtitle={user?.login ?? 'GitHub'}
        actions={[
          { label: 'Тема', onPress: onOpenThemes },
          {
            label: 'Выйти',
            onPress: () => {
              void signOut();
            },
          },
        ]}
      />
      {error !== null && status === 'ready' ? (
        <Banner
          kind="error"
          message={error}
          actionLabel="Повторить"
          onAction={refresh}
        />
      ) : null}
      {body}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.ui.canvasDefault },
    empty: { flexGrow: 1 },
    more: { margin: spacing.lg },
  });
