/**
 * GitHub Dark design tokens (Primer colour system, dark default theme).
 *
 * This lives in `shared/` because three surfaces must agree exactly: the
 * CodeMirror theme inside the WebView, the preview stylesheet, and the React
 * Native chrome. One definition is what keeps them from drifting.
 */
export const palette = {
  canvasDefault: '#0d1117',
  canvasSubtle: '#161b22',
  canvasInset: '#010409',
  borderDefault: '#30363d',
  borderMuted: '#21262d',
  fgDefault: '#e6edf3',
  fgMuted: '#8b949e',
  fgSubtle: '#6e7681',
  accent: '#2f81f7',
  blue: '#79c0ff',
  lightBlue: '#a5d6ff',
  orange: '#ffa657',
  purple: '#d2a8ff',
  green: '#7ee787',
  yellow: '#d29922',
  red: '#ff7b72',
  selection: '#264f78',
} as const;

/** Monospace stack shared by the editor, the preview and code-shaped UI text. */
export const monoFontStack =
  "ui-monospace, 'Roboto Mono', 'Droid Sans Mono', 'Courier New', monospace";
