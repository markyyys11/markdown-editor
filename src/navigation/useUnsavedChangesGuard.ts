import {useEffect, useRef} from 'react';
import {Alert, BackHandler} from 'react-native';

/**
 * Asks before throwing away edits.
 *
 * Shared by the two ways out of the editor — the on-screen back button and the
 * Android hardware Back — so they cannot disagree about what is at stake.
 */
export function confirmDiscard(onConfirm: () => void): void {
  Alert.alert(
    'Есть несохранённые правки',
    'Изменения не закоммичены и будут потеряны.',
    [
      {text: 'Остаться', style: 'cancel'},
      {text: 'Выйти', style: 'destructive', onPress: onConfirm},
    ],
  );
}

/**
 * Intercepts the Android hardware Back while there are unsaved edits.
 *
 * The listener is registered when the editor mounts, which is *after* the
 * navigator registers its own. Android dispatches Back to the most recently
 * registered listener first, so the editor gets the chance to veto the pop —
 * and the navigator's listener, which is registered once and reads the stack
 * from a ref, does not jump the queue on every navigation.
 */
export function useUnsavedChangesGuard(dirty: boolean, leave: () => void): void {
  const latest = useRef({dirty, leave});
  useEffect(() => {
    latest.current = {dirty, leave};
  }, [dirty, leave]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!latest.current.dirty) {
        return false;
      }
      confirmDiscard(() => latest.current.leave());
      return true;
    });
    return () => subscription.remove();
  }, []);
}
