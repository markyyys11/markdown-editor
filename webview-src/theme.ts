import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import type { AppTheme } from '../shared/theme';
import { EDITOR_FONT_STACK } from './fontFace';

/**
 * The colours around the code: background, gutter, caret, selection.
 *
 * Built as a function of the theme rather than a constant, because the theme can
 * change while the editor is open; `index.ts` swaps it through a Compartment.
 */
export const editorTheme = (
  theme: AppTheme,
): ReturnType<typeof EditorView.theme> =>
  EditorView.theme(
    {
      '&': {
        height: '100%',
        color: theme.ui.fgDefault,
        backgroundColor: theme.ui.canvasDefault,
      },
      '.cm-scroller': {
        fontFamily: EDITOR_FONT_STACK,
        fontSize: '14px',
        lineHeight: '1.7',
        overflow: 'auto',
        // Room to scroll the edited line above the soft keyboard.
        paddingBottom: '45vh',
      },
      '.cm-content': {
        padding: '8px 0',
        caretColor: theme.ui.accent,
      },
      '.cm-line': { padding: '0 12px' },
      '.cm-gutters': {
        backgroundColor: theme.ui.canvasDefault,
        color: theme.ui.fgSubtle,
        border: 'none',
        borderRight: `1px solid ${theme.ui.borderDefault}`,
      },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 12px' },
      '.cm-activeLineGutter': {
        backgroundColor: theme.ui.canvasSubtle,
        color: theme.ui.fgMuted,
      },
      '.cm-activeLine': { backgroundColor: theme.ui.canvasSubtle },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: theme.ui.accent,
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
        { backgroundColor: theme.ui.selection },
      '.cm-placeholder': { color: theme.ui.fgSubtle, fontStyle: 'italic' },
    },
    { dark: theme.mode === 'dark' },
  );

/**
 * Token colours for Markdown source, taken from the theme's own token scopes.
 *
 * Two places cannot follow VSCode exactly, and both are limits of the grammar
 * rather than of the mapping:
 *
 * - CodeMirror tags every Markdown mark — `#`, `**`, `>`, backticks, `-` — as
 *   `processingInstruction`, so it cannot give the `#` of a heading a different
 *   colour from the `*` of emphasis the way VSCode does. All marks therefore
 *   share the theme's dimmed colour and stay visible without competing with the
 *   text, which is the behaviour this editor was asked for.
 * - `list` covers a whole list rather than its marker, so list text keeps the
 *   default foreground instead of the marker colour.
 */
export const markupHighlightStyle = (theme: AppTheme): HighlightStyle => {
  const { markup } = theme;
  const dim = markup.comment;
  return HighlightStyle.define([
    { tag: t.heading1, color: markup.heading, fontWeight: '700' },
    { tag: t.heading2, color: markup.heading, fontWeight: '700' },
    { tag: t.heading3, color: markup.heading, fontWeight: '700' },
    { tag: t.heading4, color: markup.heading, fontWeight: '700' },
    { tag: t.heading5, color: markup.heading, fontWeight: '700' },
    { tag: t.heading6, color: markup.heading, fontWeight: '700' },
    { tag: t.strong, color: markup.bold, fontWeight: '700' },
    { tag: t.emphasis, color: markup.italic, fontStyle: 'italic' },
    {
      tag: t.strikethrough,
      color: markup.strikethrough,
      textDecoration: 'line-through',
    },
    { tag: t.monospace, color: markup.inlineCode },
    {
      tag: [t.link, t.url],
      color: markup.linkUrl,
      textDecoration: 'underline',
    },
    { tag: t.labelName, color: markup.codeLanguage },
    { tag: t.string, color: markup.codeLanguage },
    { tag: t.quote, color: markup.quote, fontStyle: 'italic' },
    { tag: t.contentSeparator, color: dim, fontWeight: '700' },
    { tag: t.processingInstruction, color: dim },
    { tag: t.escape, color: dim },
    { tag: t.character, color: dim },
    { tag: t.comment, color: dim, fontStyle: 'italic' },
    { tag: t.atom, color: dim },
    { tag: t.special(t.content), color: markup.heading },
    { tag: t.invalid, color: theme.ui.danger },
    { tag: t.list, color: theme.ui.fgDefault },
  ]);
};
