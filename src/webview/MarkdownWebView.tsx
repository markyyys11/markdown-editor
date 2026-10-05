import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet } from 'react-native';
import { WebView as UntypedWebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewProps } from 'react-native-webview';
import type { AppTheme } from '../../shared/theme';
import {
  parseWebviewMessage,
  type DocumentMode,
  type HostMessage,
  type InsertRequest,
} from '../../shared/protocol';
import { WEBVIEW_BUNDLE } from './bundle.generated';
import { buildWebviewHtml } from './html';

/** The imperative surface of the WebView that this component actually uses. */
type WebViewHandle = { postMessage(message: string): void };

/**
 * react-native-webview 14.0.1 declares
 * `class WebView<P = undefined> extends Component<WebViewProps & P>`.
 * Intersecting the props with the default `undefined` yields `never`, so the
 * published types reject every prop, `ref` included. Re-typing the value over
 * the props the library really declares restores the checking it intends, and
 * narrows `ref` to the one method used here.
 */
const WebView = UntypedWebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebViewHandle> }
>;

type Props = {
  /**
   * The document to display. Typing never comes back through here — the WebView
   * owns the text while it is being edited, and echoing keystrokes back would
   * fight the caret. This arrives only when a file is opened or reloaded.
   */
  document: string;
  /**
   * Bumped on every load so that reopening a file whose text is unchanged still
   * replaces the editor's document and clears its undo history.
   */
  documentKey: number;
  mode: DocumentMode;
  /** The active theme. Sent before anything else, and again if it changes. */
  theme: AppTheme;
  onChangeText(content: string): void;
  onOpenLink(href: string): void;
  onError(message: string): void;
};

type Handlers = Pick<Props, 'onChangeText' | 'onOpenLink' | 'onError'>;

/**
 * Commands the host sends in response to a gesture.
 *
 * These are imperative on purpose, unlike the document: a command exists only
 * because a key was tapped, so the WebView is mounted by definition when it is
 * sent. The document could not assume that — assuming it once cost every file
 * opening blank — which is why it stays a prop.
 */
export type MarkdownWebViewHandle = {
  /** Inserts markup at the caret, applying the editor's pairing rules. */
  insert(request: InsertRequest): void;
};

/**
 * Hosts the CodeMirror editor and the GitHub-style preview.
 *
 * The document is handed over as a prop rather than through an imperative
 * `setDocument`. That is the whole point of the shape: the value is already
 * present at mount time, so it cannot be lost to a ref that is still null. An
 * earlier version called `setDocument` from the screen right after
 * `setStatus('ready')`, before React had re-rendered and mounted this
 * component — the optional call silently did nothing and every file opened
 * empty.
 *
 * The queue below is still needed, but for a different gap: this component can
 * be mounted before the page inside the WebView has finished booting and
 * announced `ready`.
 */
function MarkdownWebViewImpl(
  {
    document,
    documentKey,
    mode,
    theme,
    onChangeText,
    onOpenLink,
    onError,
  }: Props,
  ref: React.ForwardedRef<MarkdownWebViewHandle>,
) {
  const webView = useRef<WebViewHandle | null>(null);
  const ready = useRef(false);
  const modeRef = useRef(mode);
  const themeRef = useRef(theme);
  /**
   * The text the page should be showing: the loaded document, and then every
   * edit the page itself reports.
   *
   * A page that has not booted yet — or that restarted after Android reclaimed
   * its renderer — comes up empty and has to be handed this again. That is also
   * why the document is a prop rather than an imperative call: it is already
   * here when the page first asks.
   */
  const currentText = useRef(document);

  // Callbacks live in a ref so the message handler can stay referentially
  // stable, which keeps the WebView from re-rendering on every keystroke.
  const handlers = useRef<Handlers>({ onChangeText, onOpenLink, onError });
  useEffect(() => {
    handlers.current = { onChangeText, onOpenLink, onError };
  }, [onChangeText, onOpenLink, onError]);

  const source = useMemo(
    () => ({ html: buildWebviewHtml(WEBVIEW_BUNDLE) }),
    [],
  );

  const push = useCallback((message: HostMessage) => {
    webView.current?.postMessage(JSON.stringify(message));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      insert: request =>
        push({ type: 'insert', text: request.text, closer: request.closer }),
    }),
    [push],
  );

  const sendDocument = useCallback(
    (content: string) => {
      currentText.current = content;
      if (ready.current) {
        push({ type: 'setDocument', content });
      }
      // While the page is booting this is enough: the `ready` handler sends
      // whatever is current by then, and only the newest text matters.
    },
    [push],
  );

  useEffect(() => {
    themeRef.current = theme;
    if (ready.current) {
      push({ type: 'setTheme', theme });
    }
    // While the page is booting this is enough: the `ready` handler sends the
    // theme before anything else, because the page keeps its panes hidden until
    // it arrives.
  }, [theme, push]);

  useEffect(() => {
    sendDocument(document);
  }, [document, documentKey, sendDocument]);

  useEffect(() => {
    modeRef.current = mode;
    if (!ready.current) {
      // Still booting; the `ready` handler sends whichever mode is current then.
      return;
    }
    push({ type: 'setMode', mode });
  }, [mode, push]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      const message = parseWebviewMessage(parsed);
      if (message === null) {
        return;
      }
      switch (message.type) {
        case 'ready': {
          ready.current = true;
          // Order matters: the page stays hidden until the theme arrives, so the
          // editor never paints in the previous palette.
          push({ type: 'setTheme', theme: themeRef.current });
          push({ type: 'setMode', mode: modeRef.current });
          push({ type: 'setDocument', content: currentText.current });
          break;
        }
        case 'change':
          currentText.current = message.content;
          handlers.current.onChangeText(message.content);
          break;
        case 'openLink':
          handlers.current.onOpenLink(message.href);
          break;
        case 'error':
          handlers.current.onError(message.message);
          break;
      }
    },
    [push],
  );

  return (
    <WebView
      ref={webView}
      source={source}
      // Required for a document loaded from an HTML string: the default
      // whitelist only permits http(s).
      originWhitelist={['*']}
      onMessage={handleMessage}
      onError={event => handlers.current.onError(event.nativeEvent.description)}
      style={[
        styles.webView,
        // Painted before the document is ready, so the editor never flashes a
        // colour that belongs to no theme.
        { backgroundColor: theme.ui.canvasDefault },
      ]}
      containerStyle={[
        styles.container,
        { backgroundColor: theme.ui.canvasDefault },
      ]}
      overScrollMode="never"
      javaScriptEnabled
      // The document needs neither web storage nor filesystem access.
      domStorageEnabled={false}
      allowFileAccess={false}
      allowUniversalAccessFromFileURLs={false}
      allowsLinkPreview={false}
      setSupportMultipleWindows={false}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1 },
});

export const MarkdownWebView = forwardRef(MarkdownWebViewImpl);
