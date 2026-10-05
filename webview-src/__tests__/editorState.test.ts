import { highlightingFor } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import { tags as t } from '@lezer/highlight';
import type { AppTheme } from '../../shared/theme';
import { createDocumentState } from '../editorState';

/**
 * Colours are irrelevant here — the question is whether a theme reaches the
 * state at all — so one value stands in for all of them.
 */
const hex = '#123456';
const theme: AppTheme = {
  id: 'fixture',
  label: 'Fixture',
  mode: 'dark',
  ui: {
    canvasDefault: hex,
    canvasSubtle: hex,
    canvasInset: hex,
    borderDefault: hex,
    borderMuted: hex,
    fgDefault: hex,
    fgMuted: hex,
    fgSubtle: hex,
    accent: hex,
    selection: hex,
    danger: hex,
    success: hex,
    warning: hex,
    info: hex,
  },
  markup: {
    heading: hex,
    headingPunctuation: hex,
    bold: hex,
    italic: hex,
    strikethrough: hex,
    inlineCode: hex,
    fencedCode: hex,
    codePunctuation: hex,
    codeLanguage: hex,
    linkText: hex,
    linkUrl: hex,
    quote: hex,
    listMarker: hex,
    frontMatter: hex,
    comment: hex,
  },
  preview: {
    background: hex,
    foreground: hex,
    muted: hex,
    border: hex,
    link: hex,
    quoteBackground: hex,
    quoteBorder: hex,
    codeBlockBackground: hex,
    inlineCodeBackground: hex,
    inlineCodeForeground: hex,
    tableHeaderBackground: hex,
  },
  code: {},
};

/**
 * The style class a heading would be given, or null when the state carries no
 * highlight style at all — `highlightingFor` is the exported way to ask. Colours
 * are not the question here; whether a theme reaches the state is.
 */
const headingClass = (state: EditorState): string | null =>
  highlightingFor(state, [t.heading1]);

describe('createDocumentState', () => {
  it('carries the theme, so a document opened later does not lose it', () => {
    // The regression guard for the reported bug. The editor's state is rebuilt
    // whenever a document is opened, and a rebuilt state takes its compartments
    // back to whatever was written into the extension list. The theme used to be
    // a fixed empty value there, so it vanished on every file open and only came
    // back when the theme was changed by hand.
    expect(
      headingClass(createDocumentState('# Привет', theme, () => {})),
    ).not.toBeNull();
  });

  it('leaves the editor uncoloured until a theme arrives', () => {
    expect(
      headingClass(createDocumentState('# Привет', null, () => {})),
    ).toBeNull();
  });

  it('keeps the document it was given', () => {
    const state = createDocumentState('# Заголовок\n\nтекст', theme, () => {});
    expect(state.doc.toString()).toBe('# Заголовок\n\nтекст');
  });

  it('starts with an empty document when a new file is created', () => {
    expect(createDocumentState('', theme, () => {}).doc.length).toBe(0);
  });
});
