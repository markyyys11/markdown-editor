import {HighlightStyle} from '@codemirror/language';
import {EditorView} from '@codemirror/view';
import {tags as t} from '@lezer/highlight';
import {monoFontStack, palette} from '../shared/palette';

/**
 * Chrome around the code: background, gutter, selection and caret.
 *
 * `paddingBottom` gives the document room to scroll above the soft keyboard so
 * the line being edited is never trapped underneath it.
 */
export const githubDarkTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      color: palette.fgDefault,
      backgroundColor: palette.canvasDefault,
    },
    '.cm-scroller': {
      fontFamily: monoFontStack,
      fontSize: '14px',
      lineHeight: '1.7',
      overflow: 'auto',
      paddingBottom: '45vh',
    },
    '.cm-content': {
      padding: '8px 0',
      caretColor: palette.accent,
    },
    '.cm-line': {padding: '0 12px'},
    '.cm-gutters': {
      backgroundColor: palette.canvasDefault,
      color: palette.fgSubtle,
      border: 'none',
      borderRight: `1px solid ${palette.borderDefault}`,
    },
    '.cm-lineNumbers .cm-gutterElement': {padding: '0 8px 0 12px'},
    '.cm-activeLineGutter': {
      backgroundColor: palette.canvasSubtle,
      color: palette.fgMuted,
    },
    '.cm-activeLine': {backgroundColor: palette.canvasSubtle},
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: palette.accent,
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      {backgroundColor: palette.selection},
    '.cm-selectionMatch': {backgroundColor: '#1f3d5c'},
    '.cm-placeholder': {color: palette.fgSubtle, fontStyle: 'italic'},
  },
  {dark: true},
);

/**
 * Token colours for Markdown source.
 *
 * Everything a document can be is a *colour* difference — never a size
 * difference — because the brief is that the text stays one size in edit mode.
 * Only weight and slant vary, matching what VS Code does to inline Markdown.
 *
 * The tag names come from the lezer Markdown grammar
 * (`node_modules/@lezer/markdown/dist/index.js`): every piece of Markdown
 * punctuation (`#`, `**`, `>`, backticks, `-`, `|`) is tagged
 * `processingInstruction`, so the special characters stay visible but subdued.
 */
export const githubDarkHighlightStyle = HighlightStyle.define([
  {tag: t.heading1, color: palette.blue, fontWeight: '700'},
  {tag: t.heading2, color: palette.blue, fontWeight: '700'},
  {tag: t.heading3, color: palette.blue, fontWeight: '700'},
  {tag: t.heading4, color: palette.blue, fontWeight: '700'},
  {tag: t.heading5, color: palette.blue, fontWeight: '700'},
  {tag: t.heading6, color: palette.blue, fontWeight: '700'},
  {tag: t.strong, color: palette.orange, fontWeight: '700'},
  {tag: t.emphasis, color: palette.purple, fontStyle: 'italic'},
  {tag: t.strikethrough, color: palette.fgMuted, textDecoration: 'line-through'},
  {tag: t.monospace, color: palette.lightBlue},
  {tag: [t.link, t.url], color: palette.accent, textDecoration: 'underline'},
  {tag: t.labelName, color: palette.accent},
  {tag: t.string, color: palette.green},
  {tag: t.quote, color: palette.fgMuted, fontStyle: 'italic'},
  {tag: t.contentSeparator, color: palette.fgSubtle, fontWeight: '700'},
  {tag: t.processingInstruction, color: palette.fgSubtle},
  {tag: t.escape, color: palette.fgMuted},
  {tag: t.character, color: palette.green},
  {tag: t.comment, color: palette.fgSubtle, fontStyle: 'italic'},
  {tag: t.atom, color: palette.green},
  {tag: t.special(t.content), color: palette.yellow},
  {tag: t.invalid, color: palette.red},
]);
