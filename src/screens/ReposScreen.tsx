import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, View} from 'react-native';
import {Banner} from '../components/Banner';
import {Button} from '../components/Button';
import {CenteredMessage} from '../components/CenteredMessage';
import {ListRow} from '../components/ListRow';
import {ScreenHeader} from '../components/ScreenHeader';
import {GitHubError, REPOS_PAGE_SIZE} from '../github/client';
import type {RepoSummary} from '../github/types';
import {useAuth, useGitHub} from '../state/AuthContext';
import {palette, spacing} from '../theme/theme';
import {formatDay} from '../util/dates';

type Props = {
  onOpenRepo(repo: RepoSummary): void;
};

export function ReposScreen({onOpenRepo}: Props) {
  const client = useGitHub();
  const {user, signOut} = useAuth();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
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
        renderItem={({item}) => (
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
            colors={[palette.accent]}
            progressBackgroundColor={palette.canvasSubtle}
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

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvasDefault},
  empty: {flexGrow: 1},
  more: {margin: spacing.lg},
});
