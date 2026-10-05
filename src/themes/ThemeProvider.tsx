import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { readSelectedTheme, writeSelectedTheme } from '../storage/prefs';
import { DEFAULT_THEME_ID, THEMES } from './generated/themes';
import type { AppTheme } from './types';

type ThemeContextValue = {
  theme: AppTheme;
  /** Every theme the app offers, for the pickers. */
  themes: readonly AppTheme[];
  selectTheme(id: string): void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolve = (id: string | null): AppTheme => {
  const found = id === null ? undefined : THEMES.find(theme => theme.id === id);
  return (
    found ??
    THEMES.find(theme => theme.id === DEFAULT_THEME_ID) ??
    // `THEMES` is generated and never empty; this only satisfies the type.
    (THEMES[0] as AppTheme)
  );
};

/**
 * Holds the active theme and remembers the choice.
 *
 * Children are withheld until the stored preference has been read, so the app
 * does not paint the default theme and then switch: by the time anything is on
 * screen the decision is already made. The wait is a single storage read, and
 * the sign-in screen covers it in practice.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    readSelectedTheme()
      .then(stored => {
        if (!cancelled && stored !== null) {
          setId(stored);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRestored(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectTheme = useCallback((next: string) => {
    setId(next);
    // Persisting is best effort; the theme is already applied on screen.
    void writeSelectedTheme(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolve(id ?? DEFAULT_THEME_ID),
      themes: THEMES,
      selectTheme,
    }),
    [id, selectTheme],
  );

  if (!restored) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): AppTheme {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useTheme() must be used inside <ThemeProvider>');
  }
  return value.theme;
}

/** The active theme plus everything needed to change it. */
export function useThemePicker(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value === null) {
    throw new Error('useThemePicker() must be used inside <ThemeProvider>');
  }
  return value;
}
