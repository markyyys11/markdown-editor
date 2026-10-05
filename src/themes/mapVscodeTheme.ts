import type {
  AppTheme,
  CodeColors,
  MarkupColors,
  PreviewColors,
  ThemeMode,
  UiColors,
} from './types';

/** The part of a VSCode colour theme this app reads. */
export type VscodeThemeJson = {
  name?: string;
  colors?: Record<string, string | undefined>;
  tokenColors?: ReadonlyArray<{
    scope?: string | readonly string[];
    settings?: { foreground?: string; fontStyle?: string };
  }>;
};

type TokenEntry = { selectors: readonly string[]; foreground?: string };

/**
 * The scope each Markdown role really carries in a token, verified against real
 * themes before it was written down.
 *
 * `markup.heading.markdown` is deliberately absent from the heading entry: the
 * heading token in Markdown is `entity.name.section`, while a selector of
 * `markup.heading` matches nothing, so asking for it finds no colour at all.
 */
const MARKUP_SCOPES: Record<keyof MarkupColors, readonly string[]> = {
  heading: ['entity.name.section', 'markup.heading.setext'],
  headingPunctuation: ['punctuation.definition.heading'],
  bold: ['markup.bold'],
  italic: ['markup.italic'],
  strikethrough: ['markup.strikethrough'],
  inlineCode: ['markup.inline.raw.string.markdown', 'markup.inline.raw'],
  fencedCode: ['markup.fenced_code.block.markdown', 'markup.raw.block'],
  codePunctuation: [
    'punctuation.definition.raw.markdown',
    'punctuation.definition.raw',
  ],
  codeLanguage: ['fenced_code.block.language'],
  linkText: ['string.other.link'],
  linkUrl: ['markup.underline.link'],
  quote: ['markup.quote'],
  listMarker: ['punctuation.definition.list.begin'],
  frontMatter: ['string.unquoted.plain.out.yaml', 'string.unquoted.plain.out'],
  comment: ['comment'],
};

/**
 * highlight.js classes, in the order their scopes are tried.
 *
 * The classes are what the preview's code blocks are marked up with, so mapping
 * them from the same token colours keeps a fenced block in the preview coloured
 * like the same code in the editor.
 */
const CODE_SCOPES: ReadonlyArray<readonly [string, readonly string[]]> = [
  [
    'keyword',
    ['keyword.control', 'keyword', 'storage.modifier', 'storage.type'],
  ],
  ['built_in', ['support.function', 'support.class', 'support.type']],
  ['type', ['entity.name.type', 'support.type']],
  ['literal', ['constant.language', 'constant.character']],
  ['number', ['constant.numeric']],
  ['string', ['string']],
  ['regexp', ['string.regexp']],
  ['comment', ['comment']],
  ['meta', ['meta.preprocessor', 'meta']],
  ['title', ['entity.name.function', 'entity.name.class']],
  ['function', ['meta.function-call', 'entity.name.function']],
  ['params', ['variable.parameter']],
  ['variable', ['variable.other', 'variable']],
  ['attr', ['entity.other.attribute-name']],
  ['tag', ['entity.name.tag']],
  ['symbol', ['constant.other.symbol']],
  ['bullet', ['punctuation.definition.list']],
  ['emphasis', ['markup.italic']],
  ['strong', ['markup.bold']],
  ['link', ['markup.underline.link']],
  ['selector-tag', ['entity.name.tag.css']],
  ['selector-class', ['entity.other.attribute-name.class.css']],
  ['section', ['entity.name.section']],
  ['addition', ['markup.inserted']],
  ['deletion', ['markup.deleted']],
  ['operator', ['keyword.operator']],
  ['punctuation', ['punctuation']],
];

/** Colour keys the chrome reads, in the order they are tried. */
const UI_KEYS: Record<keyof UiColors, readonly string[]> = {
  canvasDefault: ['editor.background'],
  canvasSubtle: [
    'sideBar.background',
    'editorGroupHeader.tabsBackground',
    'editor.background',
  ],
  canvasInset: ['panel.background', 'input.background', 'editor.background'],
  borderDefault: ['panel.border', 'sideBar.border', 'editorGroup.border'],
  borderMuted: [], // derived from borderDefault by adding alpha
  fgDefault: ['editor.foreground', 'foreground'],
  fgMuted: ['descriptionForeground', 'sideBar.foreground', 'editor.foreground'],
  fgSubtle: [
    'editorLineNumber.foreground',
    'disabledForeground',
    'descriptionForeground',
  ],
  accent: [
    'textLink.foreground',
    'focusBorder',
    'button.background',
    'progressBar.background',
  ],
  selection: ['editor.selectionBackground', 'list.activeSelectionBackground'],
  danger: ['editorError.foreground', 'errorForeground', 'list.errorForeground'],
  success: [
    'gitDecoration.addedResourceForeground',
    'terminal.ansiGreen',
    'testing.iconPassed',
  ],
  warning: [
    'editorWarning.foreground',
    'list.warningForeground',
    'terminal.ansiYellow',
  ],
  info: [
    'editorInfo.foreground',
    'notificationsInfoIcon.foreground',
    'terminal.ansiBlue',
  ],
};

/** Preview keys, taken from what VSCode's own Markdown preview uses. */
const PREVIEW_KEYS: Record<keyof PreviewColors, readonly string[]> = {
  background: ['editor.background'],
  foreground: ['editor.foreground', 'foreground'],
  muted: ['descriptionForeground', 'sideBar.foreground'],
  border: ['panel.border', 'editorGroup.border'],
  link: ['textLink.foreground', 'textLink.activeForeground'],
  quoteBackground: ['textBlockQuote.background'],
  quoteBorder: ['textBlockQuote.border'],
  codeBlockBackground: ['textCodeBlock.background', 'textPreformat.background'],
  inlineCodeBackground: ['textPreformat.background'],
  inlineCodeForeground: ['textPreformat.foreground'],
  tableHeaderBackground: [
    'editorWidget.background',
    'sideBarSectionHeader.background',
  ],
};

/** Where a preview colour falls back to when the theme omits its key. */
const PREVIEW_FALLBACKS: Record<keyof PreviewColors, keyof UiColors> = {
  background: 'canvasDefault',
  foreground: 'fgDefault',
  muted: 'fgMuted',
  border: 'borderDefault',
  link: 'accent',
  quoteBackground: 'canvasSubtle',
  quoteBorder: 'borderDefault',
  codeBlockBackground: 'canvasSubtle',
  inlineCodeBackground: 'canvasSubtle',
  inlineCodeForeground: 'fgDefault',
  tableHeaderBackground: 'canvasSubtle',
};

/** Used only when a theme omits a key outright, which real themes almost never do. */
const FALLBACKS: Record<ThemeMode, UiColors> = {
  dark: {
    canvasDefault: '#1f1f1f',
    canvasSubtle: '#252526',
    canvasInset: '#181818',
    borderDefault: '#3c3c3c',
    borderMuted: '#3c3c3c66',
    fgDefault: '#d4d4d4',
    fgMuted: '#9d9d9d',
    fgSubtle: '#6e7681',
    accent: '#4daafc',
    selection: '#264f78',
    danger: '#f14c4c',
    success: '#89d185',
    warning: '#cca700',
    info: '#3794ff',
  },
  light: {
    canvasDefault: '#ffffff',
    canvasSubtle: '#f3f3f3',
    canvasInset: '#ececec',
    borderDefault: '#d4d4d4',
    borderMuted: '#d4d4d466',
    fgDefault: '#1f1f1f',
    fgMuted: '#616161',
    fgSubtle: '#8b949e',
    accent: '#005fb8',
    selection: '#add6ff',
    danger: '#e51400',
    success: '#00a15c',
    warning: '#bf8803',
    info: '#0066bf',
  },
};

const HEX = /^#([0-9a-fA-F]{3,8})$/;

const isColor = (value: string | undefined): value is string =>
  typeof value === 'string' && HEX.test(value);

/** Adds alpha to a hex colour, so a hairline can be a dimmed version of a border. */
export function withAlpha(color: string, alpha: string): string {
  if (!isColor(color)) {
    return color;
  }
  const body = color.slice(1);
  if (body.length === 3) {
    const [r, g, b] = [...body];
    return `#${r}${r}${g}${g}${b}${b}${alpha}`;
  }
  if (body.length === 6) {
    return `#${body}${alpha}`;
  }
  // Already has alpha: replace it rather than inventing a second one.
  return body.length === 8 ? `#${body.slice(0, 6)}${alpha}` : color;
}

/** Whether a selector applies to a token: a prefix at a dot boundary. */
function isPrefix(selector: string, scope: string): boolean {
  return scope === selector || scope.startsWith(`${selector}.`);
}

function parseTokenColors(theme: VscodeThemeJson): TokenEntry[] {
  const raw = theme.tokenColors ?? [];
  return raw.map(entry => ({
    selectors: (Array.isArray(entry.scope)
      ? entry.scope
      : [entry.scope]
    ).filter((selector): selector is string => typeof selector === 'string'),
    foreground: entry.settings?.foreground,
  }));
}

/**
 * The colour a token of this scope would get, following TextMate's rule: a
 * selector applies when it is a prefix of the token's scope at a dot boundary,
 * and the longest matching selector wins.
 *
 * Substring matching would be wrong here and quietly so: it pulls in selectors
 * meant for other languages — `punctuation.definition.list.begin.python` would
 * answer a question about Markdown lists.
 */
export function resolveScope(
  entries: readonly TokenEntry[],
  scope: string,
): string | undefined {
  let best: { selector: string; foreground?: string } | null = null;
  for (const entry of entries) {
    if (!isColor(entry.foreground)) {
      continue;
    }
    for (const selector of entry.selectors) {
      if (selector.includes(' ') || !isPrefix(selector, scope)) {
        continue;
      }
      if (best === null || selector.length > best.selector.length) {
        best = { selector, foreground: entry.foreground };
      }
    }
  }
  return best?.foreground;
}

const firstDefined = (
  colors: Record<string, string | undefined>,
  keys: readonly string[],
): string | undefined => {
  for (const key of keys) {
    const value = colors[key];
    if (isColor(value)) {
      return value;
    }
  }
  return undefined;
};

const firstScope = (
  entries: readonly TokenEntry[],
  scopes: readonly string[],
): string | undefined => {
  for (const scope of scopes) {
    const color = resolveScope(entries, scope);
    if (color !== undefined) {
      return color;
    }
  }
  return undefined;
};

/**
 * Converts one VSCode theme into the app's model.
 *
 * Pure on purpose: the generator that writes the theme table and the tests that
 * check it both call this, so the rules only exist once.
 */
export function mapVscodeTheme(
  theme: VscodeThemeJson,
  meta: { id: string; label: string; mode: ThemeMode },
): AppTheme {
  const colors = theme.colors ?? {};
  const entries = parseTokenColors(theme);
  const fallback = FALLBACKS[meta.mode];

  const ui = {} as UiColors;
  for (const role of Object.keys(UI_KEYS) as Array<keyof UiColors>) {
    if (role === 'borderMuted') {
      continue;
    }
    const keys = UI_KEYS[role];
    ui[role] = firstDefined(colors, keys) ?? fallback[role];
  }
  ui.borderMuted = withAlpha(ui.borderDefault, '66');

  const markup = {} as MarkupColors;
  for (const role of Object.keys(MARKUP_SCOPES) as Array<keyof MarkupColors>) {
    const punctuation = role.endsWith('Punctuation') || role === 'listMarker';
    const fallbackColor = punctuation ? ui.fgSubtle : ui.fgDefault;
    // Bold and italic may be expressed as a font style without a colour; the
    // text still needs one, so it borrows the theme's default foreground.
    markup[role] = firstScope(entries, MARKUP_SCOPES[role]) ?? fallbackColor;
  }

  const preview = {} as PreviewColors;
  for (const role of Object.keys(PREVIEW_KEYS) as Array<keyof PreviewColors>) {
    preview[role] =
      firstDefined(colors, PREVIEW_KEYS[role]) ?? ui[PREVIEW_FALLBACKS[role]];
  }

  const code: Record<string, string> = {};
  for (const [className, scopes] of CODE_SCOPES) {
    const color = firstScope(entries, scopes);
    if (color !== undefined) {
      code[className] = color;
    }
  }

  return {
    id: meta.id,
    label: meta.label,
    mode: meta.mode,
    ui,
    markup,
    preview,
    code: code as CodeColors,
  };
}

/** The file name component used as a theme id: `bearded-theme-arc.json` → `arc`. */
export function slugFromFileName(fileName: string): string {
  return fileName
    .replace(/\.json$/i, '')
    .replace(/^bearded-theme-/i, '')
    .toLowerCase();
}
