import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_THEME_KEY = 'markdown-editor:selected-theme';

/**
 * The chosen theme, remembered between launches.
 *
 * Failures are swallowed on purpose: a preference that cannot be read or written
 * only means the app opens with its default theme, which is not worth surfacing
 * an error for.
 */
export async function readSelectedTheme(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELECTED_THEME_KEY);
  } catch {
    return null;
  }
}

export async function writeSelectedTheme(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SELECTED_THEME_KEY, id);
  } catch {
    // The theme is already on screen; only the memory of it is lost.
  }
}
