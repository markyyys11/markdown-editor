import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  markdown,
  markdownKeymap,
  markdownLanguage,
} from '@codemirror/lang-markdown';
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import type { Extension, StateEffect } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import type { AppTheme } from '../shared/theme';
import { editorTheme, markupHighlightStyle } from './theme';

/**
 * The page hosts exactly one editor, so the compartments carrying the theme are
 * created once and shared between the extension list and the code that swaps the
 * theme at runtime.
 */
export const themeCompartment = new Compartment();
export const highlightCompartment = new Compartment();

/**
 * Everything the editor is configured with.
 *
 * The theme is a **parameter** rather than a fixed initial value, and that is the
 * whole point of this function existing. The editor's state is rebuilt whenever a
 * document is opened, and a rebuilt state takes its compartments back to the
 * values written here — so a theme that had only ever been reconfigured at
 * runtime silently vanished on every file open. Taking the theme as an argument
 * makes that impossible to write again.
 */
export function createEditorExtensions(theme: AppTheme | null): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    highlightActiveLine(),
    EditorView.lineWrapping,
    placeholder('Начните печатать Markdown…'),
    markdown({ base: markdownLanguage }),
    themeCompartment.of(theme === null ? [] : [editorTheme(theme)]),
    highlightCompartment.of(
      theme === null ? [] : [syntaxHighlighting(markupHighlightStyle(theme))],
    ),
    // Markdown is not prose: autocorrect and autocapitalisation would rewrite
    // syntax as the user types it.
    EditorView.contentAttributes.of({
      autocapitalize: 'off',
      autocorrect: 'off',
      spellcheck: 'false',
    }),
    // `markdownKeymap` first so Enter continues lists and quotes, and Backspace
    // removes one level of Markdown markup, as it does in VS Code.
    keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap]),
  ];
}

/**
 * The effects that swap the theme of a live editor.
 *
 * Kept here rather than in the page code so that everything CodeMirror needs to
 * know about theming lives in one module.
 */
export function themeReconfigurations(theme: AppTheme): StateEffect<unknown>[] {
  return [
    themeCompartment.reconfigure(editorTheme(theme)),
    highlightCompartment.reconfigure(
      syntaxHighlighting(markupHighlightStyle(theme)),
    ),
  ];
}

/**
 * The editor state for a document, with the theme already in place.
 *
 * Used both when the editor is first created and whenever a document is
 * replaced, which is precisely the pair that used to disagree.
 */
export function createDocumentState(
  content: string,
  theme: AppTheme | null,
  onDocChanged: (content: string) => void,
): EditorState {
  return EditorState.create({
    doc: content,
    extensions: [
      ...createEditorExtensions(theme),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          onDocChanged(update.state.doc.toString());
        }
      }),
    ],
  });
}
