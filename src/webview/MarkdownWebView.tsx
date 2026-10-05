import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {StyleSheet} from 'react-native';
import {WebView as UntypedWebView} from 'react-native-webview';
import type {WebViewMessageEvent, WebViewProps} from 'react-native-webview';
import type {DocumentMode, HostMessage} from '../../shared/protocol';
import {parseWebviewMessage} from '../../shared/protocol';
import {palette} from '../theme/theme';
import {WEBVIEW_BUNDLE} from './bundle.generated';
import {buildWebviewHtml} from './html';

/** The imperative surface of the WebView that this component actually uses. */
type WebViewHandle = {postMessage(message: string): void};

/**
 * react-native-webview 14.0.1 declares
 * `class WebView<P = undefined> extends Component<WebViewProps & P>`.
 * Intersecting the props with the default `undefined` yields `never`, so the
 * published types reject every prop, `ref` included. Re-typing the value over
 * the props the library really declares restores the checking it intends, and
 * narrows `ref` to the one method used here.
 */
const WebView = UntypedWebView as unknown as React.ComponentType<
  WebViewProps & {ref?: React.Ref<WebViewHandle>}
>;

export type MarkdownWebViewHandle = {
  /** Switches between the Markdown source and the rendered preview. */
  setMode(mode: DocumentMode): void;
  /** Replaces the document and its undo history, as when a file is opened. */
  setDocument(content: string): void;
};

type Props = {
  mode: DocumentMode;
  onChangeText(content: string): void;
  onOpenLink(href: string): void;
  onError(message: string): void;
};

type Handlers = Pick<Props, 'onChangeText' | 'onOpenLink' | 'onError'>;

/**
 * Hosts the CodeMirror editor and the GitHub-style preview.
 *
 * The WebView is the source of truth for the text while the user types: the
 * host is told about edits (`change`) but never pushes them back, which would
 * fight the caret. `setDocument` is therefore reserved for opening a file.
 */
function MarkdownWebViewImpl(
  {mode, onChangeText, onOpenLink, onError}: Props,
  ref: React.ForwardedRef<MarkdownWebViewHandle>,
) {
  const webView = useRef<WebViewHandle | null>(null);
  const ready = useRef(false);
  const queue = useRef<HostMessage[]>([]);
  const modeRef = useRef(mode);

  // Callbacks live in a ref so the message handler can stay referentially
  // stable, which keeps the WebView from re-rendering on every keystroke.
  const handlers = useRef<Handlers>({onChangeText, onOpenLink, onError});
  useEffect(() => {
    handlers.current = {onChangeText, onOpenLink, onError};
  }, [onChangeText, onOpenLink, onError]);

  const source = useMemo(() => ({html: buildWebviewHtml(WEBVIEW_BUNDLE)}), []);

  const push = useCallback((message: HostMessage) => {
    webView.current?.postMessage(JSON.stringify(message));
  }, []);

  const send = useCallback(
    (message: HostMessage) => {
      if (ready.current) {
        push(message);
        return;
      }
      // A document sent before the bundle finished booting replaces any earlier
      // one instead of piling up behind it.
      if (message.type === 'setDocument') {
        queue.current = queue.current.filter(
          pending => pending.type !== 'setDocument',
        );
      }
      queue.current.push(message);
    },
    [push],
  );

  useImperativeHandle(
    ref,
    () => ({
      setMode: next => send({type: 'setMode', mode: next}),
      setDocument: next => send({type: 'setDocument', content: next}),
    }),
    [send],
  );

  useEffect(() => {
    modeRef.current = mode;
    send({type: 'setMode', mode});
  }, [mode, send]);

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
          // The bundle boots into edit mode, so restate what this screen wants
          // and only then deliver whatever was queued while it was starting.
          push({type: 'setMode', mode: modeRef.current});
          const pending = queue.current;
          queue.current = [];
          pending.forEach(item => push(item));
          break;
        }
        case 'change':
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
      style={styles.webView}
      containerStyle={styles.container}
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
  container: {
    flex: 1,
    backgroundColor: palette.canvasDefault,
  },
  webView: {
    flex: 1,
    // Painted before the document is ready, so the editor does not flash white.
    backgroundColor: palette.canvasDefault,
  },
});

export const MarkdownWebView = forwardRef(MarkdownWebViewImpl);
