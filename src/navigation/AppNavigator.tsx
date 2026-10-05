import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {BrowseScreen} from '../screens/BrowseScreen';
import {EditorScreen} from '../screens/EditorScreen';
import {ReposScreen} from '../screens/ReposScreen';
import {palette} from '../theme/theme';
import type {Route} from './routes';

type Entry = {id: number; route: Route};

function renderRoute(
  route: Route,
  push: (next: Route) => void,
  pop: () => void,
) {
  switch (route.name) {
    case 'repos':
      return <ReposScreen onOpenRepo={repo => push({name: 'browse', repo, path: ''})} />;
    case 'browse':
      return (
        <BrowseScreen
          repo={route.repo}
          path={route.path}
          onBack={pop}
          onOpenDirectory={path =>
            push({name: 'browse', repo: route.repo, path})
          }
          onOpenFile={file =>
            push({
              name: 'editor',
              repo: route.repo,
              branch: file.branch,
              path: file.path,
              isNew: file.isNew,
            })
          }
        />
      );
    case 'editor':
      return (
        <EditorScreen
          repo={route.repo}
          branch={route.branch}
          path={route.path}
          isNew={route.isNew}
          onBack={pop}
          onOpenMarkdown={path =>
            push({
              name: 'editor',
              repo: route.repo,
              branch: route.branch,
              path,
              isNew: false,
            })
          }
        />
      );
  }
  return null;
}

/**
 * A three-screen stack: repositories, a directory listing, the editor.
 *
 * Screens below the top one stay mounted but hidden, so going back restores the
 * directory you were in, its scroll position and its branch — and so that a
 * link followed from a document does not discard the document it came from.
 */
export function AppNavigator() {
  const [stack, setStack] = useState<Entry[]>(() => [
    {id: 0, route: {name: 'repos'}},
  ]);
  const nextId = useRef(1);
  const stackRef = useRef(stack);

  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  const push = useCallback((route: Route) => {
    nextId.current += 1;
    const id = nextId.current;
    setStack(current => [...current, {id, route}]);
  }, []);

  const pop = useCallback(() => {
    setStack(current => (current.length > 1 ? current.slice(0, -1) : current));
  }, []);

  useEffect(() => {
    // Registered exactly once, before any screen registers its own. Android
    // dispatches Back to the most recently registered listener first, so a
    // screen that needs to vet the pop (the editor, protecting unsaved work)
    // gets to do so — but only as long as this listener is not re-registered
    // on every navigation.
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (stackRef.current.length > 1) {
          pop();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [pop]);

  return (
    <View style={styles.root}>
      {stack.map((entry, index) => {
        const isTop = index === stack.length - 1;
        return (
          <View
            key={entry.id}
            style={[styles.screen, isTop ? null : styles.hidden]}
            pointerEvents={isTop ? 'auto' : 'none'}
            importantForAccessibility={
              isTop ? 'auto' : 'no-hide-descendants'
            }>
            {renderRoute(entry.route, push, pop)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: palette.canvasDefault},
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.canvasDefault,
  },
  hidden: {display: 'none'},
});
