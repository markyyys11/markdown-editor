import { useMemo } from 'react';
import { useTheme } from './ThemeProvider';
import type { AppTheme } from './types';

/**
 * Builds a component's stylesheet from the active theme.
 *
 * `create` has to be a module-level function so that its identity is stable;
 * the stylesheet is then built once per theme rather than on every render, and
 * swapping themes rebuilds it exactly once.
 */
export function useThemedStyles<T>(create: (theme: AppTheme) => T): T {
  const theme = useTheme();
  return useMemo(() => create(theme), [create, theme]);
}
