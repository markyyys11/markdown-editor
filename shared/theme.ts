/**
 * The theme model, shared by the React Native host and the WebView bundle.
 *
 * It lives in `shared/` because both sides render from it: the host paints its
 * chrome with `ui`, and the page paints the editor with `markup`, the preview
 * with `preview` and code blocks with `code`.
 */

export type ThemeMode = 'dark' | 'light';

/**
 * Colours for the React Native chrome.
 *
 * Named after the role a colour plays rather than after the VSCode key it came
 * from, because every screen already refers to these names.
 */
export type UiColors = {
  /** The surface behind everything: `editor.background`. */
  canvasDefault: string;
  /** Raised surfaces — headers, bars, buttons: `sideBar.background`. */
  canvasSubtle: string;
  /** Recessed surfaces — inputs, list rows: `panel.background`. */
  canvasInset: string;
  borderDefault: string;
  /** A dimmer border for hairlines between rows. */
  borderMuted: string;
  fgDefault: string;
  fgMuted: string;
  /** The dimmest text: line numbers, placeholders. */
  fgSubtle: string;
  /** Links, focus rings, the primary action. */
  accent: string;
  selection: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
};

/** Colours for Markdown syntax in the editor, from the theme's token scopes. */
export type MarkupColors = {
  heading: string;
  headingPunctuation: string;
  bold: string;
  italic: string;
  strikethrough: string;
  inlineCode: string;
  fencedCode: string;
  codePunctuation: string;
  codeLanguage: string;
  linkText: string;
  linkUrl: string;
  quote: string;
  listMarker: string;
  frontMatter: string;
  /** Comments and other deliberately dimmed content. */
  comment: string;
};

/**
 * Colours for the rendered preview.
 *
 * These come from the keys VSCode itself uses for its Markdown preview
 * (`textLink`, `textBlockQuote`, `textCodeBlock`, `textPreformat`), so the
 * preview follows the theme the same way VSCode's own preview does.
 */
export type PreviewColors = {
  background: string;
  foreground: string;
  muted: string;
  border: string;
  link: string;
  quoteBackground: string;
  quoteBorder: string;
  codeBlockBackground: string;
  inlineCodeBackground: string;
  inlineCodeForeground: string;
  /** Behind table header cells. */
  tableHeaderBackground: string;
};

/** highlight.js class name to colour, for fenced code in the preview. */
export type CodeColors = Readonly<Record<string, string>>;

export type AppTheme = {
  /** Slug from the theme file name; also the stored preference. */
  id: string;
  label: string;
  mode: ThemeMode;
  ui: UiColors;
  markup: MarkupColors;
  preview: PreviewColors;
  code: CodeColors;
};
