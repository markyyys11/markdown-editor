/**
 * The theme model itself lives in `shared/theme.ts`, because the WebView bundle
 * renders from it too. This re-export keeps the app-side imports pointing at one
 * place.
 */
export type {
  AppTheme,
  CodeColors,
  MarkupColors,
  PreviewColors,
  ThemeMode,
  UiColors,
} from '../../shared/theme';
