/**
 * Entry point of the bundle that runs inside the WebView.
 *
 * It owns two panes: the CodeMirror editor (Markdown source) and the rendered
 * preview. Exactly one is visible at a time, but both stay mounted so that
 * switching modes never costs undo history or a re-parse of the document.
 */
import type {
  DocumentMode,
  HostMessage,
  InsertRequest,
  WebviewMessage,
} from '../shared/protocol';
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands';
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
import {EditorState} from '@codemirror/state';
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
import {planInsert} from './insert';
import {previewCss, renderMarkdown} from './preview';
import {githubDarkHighlightStyle, githubDarkTheme} from './theme';

/** How long typing settles before the document is pushed to React Native. */
const CHANGE_DEBOUNCE_MS = 250;

const editorHost = document.getElementById('editor');
const previewHost = document.getElementById('preview');
const bootHost = document.getElementById('boot');

if (!editorHost || !previewHost) {
  throw new Error('The WebView shell is missing its editor or preview pane');
}

const previewStyles = document.createElement('style');
previewStyles.textContent = previewCss;
document.head.appendChild(previewStyles);

let pendingChange: number | null = null;
let mode: DocumentMode = 'edit';

function post(message: WebviewMessage): void {
  const bridge = (
    window as unknown as {
      ReactNativeWebView?: {postMessage(data: string): void};
    }
  ).ReactNativeWebView;
  bridge?.postMessage(JSON.stringify(message));
}

function scheduleChange(content: string): void {
  if (pendingChange !== null) {
    window.clearTimeout(pendingChange);
  }
  pendingChange = window.setTimeout(() => {
    pendingChange = null;
    post({type: 'change', content});
  }, CHANGE_DEBOUNCE_MS);
}

/** Pushes a debounced edit immediately — used before the pane is hidden. */
function flushChange(): void {
  if (pendingChange === null) {
    return;
  }
  window.clearTimeout(pendingChange);
  pendingChange = null;
  post({type: 'change', content: view.state.doc.toString()});
}

const editorExtensions = [
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
  markdown({base: markdownLanguage}),
  syntaxHighlighting(githubDarkHighlightStyle),
  githubDarkTheme,
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
  EditorView.updateListener.of(update => {
    if (update.docChanged) {
      scheduleChange(update.state.doc.toString());
    }
  }),
];

const view = new EditorView({
  parent: editorHost,
  state: EditorState.create({doc: '', extensions: editorExtensions}),
});

function renderPreview(): void {
  previewHost!.innerHTML = renderMarkdown(view.state.doc.toString());
}

function setMode(next: DocumentMode): void {
  mode = next;
  const showingPreview = next === 'preview';
  if (showingPreview) {
    flushChange();
    view.contentDOM.blur();
    renderPreview();
  }
  editorHost!.hidden = showingPreview;
  previewHost!.hidden = !showingPreview;
}

/**
 * Replaces the whole document *and* its undo history. Used when a file is
 * opened: undoing back into the previously viewed file would be a bug.
 */
function setDocument(content: string): void {
  if (pendingChange !== null) {
    window.clearTimeout(pendingChange);
    pendingChange = null;
  }
  view.setState(EditorState.create({doc: content, extensions: editorExtensions}));
  if (mode === 'preview') {
    renderPreview();
  }
}

/**
 * Applies a keypad key at the caret. The rules live in `planInsert`; this only
 * reads the facts it needs out of the editor and dispatches the result.
 */
function insertMarkup(request: InsertRequest): void {
  const range = view.state.selection.main;
  const plan = planInsert({
    from: range.from,
    to: range.to,
    selected: view.state.sliceDoc(range.from, range.to),
    next: view.state.sliceDoc(
      range.from,
      range.from + (request.closer?.length ?? 0),
    ),
    request,
  });
  view.dispatch(
    plan.changes === undefined
      ? {selection: plan.selection}
      : {changes: plan.changes, selection: plan.selection},
  );
  // Tapping a key on the host strips focus from the page on some Android
  // builds; taking it back keeps the soft keyboard up and scrolls the caret
  // into view.
  view.focus();
}

previewHost.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const anchor = target.closest('a');
  if (!anchor) {
    return;
  }
  event.preventDefault();
  const href = anchor.getAttribute('href');
  if (href) {
    post({type: 'openLink', href});
  }
});

const onRawMessage = (event: Event): void => {
  const data = (event as {data?: unknown}).data;
  if (typeof data !== 'string') {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    post({type: 'error', message: 'Хост прислал не-JSON сообщение'});
    return;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return;
  }
  const message = parsed as HostMessage;
  switch (message.type) {
    case 'setMode':
      setMode(message.mode);
      break;
    case 'setDocument':
      setDocument(message.content);
      break;
    case 'insert':
      insertMarkup(message);
      break;
    default:
      break;
  }
};

// react-native-webview's Android implementation delivers host messages by
// dispatching a MessageEvent on `document` (see RNCWebViewManager.postMessage),
// so that is the only listener this bundle needs.
document.addEventListener('message', onRawMessage);

bootHost?.remove();
editorHost.hidden = false;
previewHost.hidden = true;
post({type: 'ready'});
