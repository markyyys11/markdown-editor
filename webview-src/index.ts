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
import type { AppTheme } from '../shared/theme';
import { EditorView } from '@codemirror/view';
import { createDocumentState, themeReconfigurations } from './editorState';
import { planInsert } from './insert';
import { previewCss } from './previewCss';
import { renderMarkdown } from './preview';

/** How long typing settles before the document is pushed to React Native. */
const CHANGE_DEBOUNCE_MS = 250;

const editorHost = document.getElementById('editor');
const previewHost = document.getElementById('preview');
const bootHost = document.getElementById('boot');

if (!editorHost || !previewHost) {
  throw new Error('The WebView shell is missing its editor or preview pane');
}

const previewStyles = document.createElement('style');
document.head.appendChild(previewStyles);

let pendingChange: number | null = null;
let mode: DocumentMode = 'edit';
/**
 * Until the theme arrives the panes stay hidden.
 *
 * The host always sends the theme before anything else, and the shell's
 * background is transparent so that what shows through is the React Native
 * container — which is already painted in the active theme. Painting the editor
 * first would flash the wrong palette whenever the theme is a light one.
 */
let themeReady = false;

// The theme the editor currently holds, so that replacing the document can put
// the same theme into the new state rather than losing it — which is exactly
// what used to happen on every file open.
let currentTheme: AppTheme | null = null;

function post(message: WebviewMessage): void {
  const bridge = (
    window as unknown as {
      ReactNativeWebView?: { postMessage(data: string): void };
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
    post({ type: 'change', content });
  }, CHANGE_DEBOUNCE_MS);
}

/** Pushes a debounced edit immediately — used before the pane is hidden. */
function flushChange(): void {
  if (pendingChange === null) {
    return;
  }
  window.clearTimeout(pendingChange);
  pendingChange = null;
  post({ type: 'change', content: view.state.doc.toString() });
}

const view = new EditorView({
  parent: editorHost,
  // The theme is null until the host sends one, moments later; the extension
  // list is built from it either way, which is what keeps a document opened
  // later from dropping the theme.
  state: createDocumentState('', currentTheme, scheduleChange),
});

function revealPanes(): void {
  const showingPreview = mode === 'preview';
  editorHost!.hidden = showingPreview;
  previewHost!.hidden = !showingPreview;
}

function renderPreview(): void {
  previewHost!.innerHTML = renderMarkdown(view.state.doc.toString());
}

/**
 * Applies a theme: the editor's chrome and syntax colours through the
 * compartments, the preview through its own stylesheet, and the shell's
 * remaining colours through custom properties.
 */
function setTheme(theme: AppTheme): void {
  currentTheme = theme;
  view.dispatch({ effects: themeReconfigurations(theme) });

  previewStyles.textContent = previewCss(theme);

  const root = document.documentElement;
  root.style.colorScheme = theme.mode;
  root.style.setProperty('--md-fg', theme.ui.fgDefault);
  root.style.setProperty('--md-muted', theme.ui.fgMuted);

  themeReady = true;
  revealPanes();
}

function setMode(next: DocumentMode): void {
  mode = next;
  const showingPreview = next === 'preview';
  if (showingPreview) {
    flushChange();
    view.contentDOM.blur();
    renderPreview();
  }
  if (themeReady) {
    revealPanes();
  }
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
  view.setState(createDocumentState(content, currentTheme, scheduleChange));
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
      ? { selection: plan.selection }
      : { changes: plan.changes, selection: plan.selection },
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
    post({ type: 'openLink', href });
  }
});

const onRawMessage = (event: Event): void => {
  const data = (event as { data?: unknown }).data;
  if (typeof data !== 'string') {
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    post({ type: 'error', message: 'Хост прислал не-JSON сообщение' });
    return;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return;
  }
  const message = parsed as HostMessage;
  switch (message.type) {
    case 'setTheme':
      setTheme(message.theme);
      break;
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
post({ type: 'ready' });
