import { monoFontStack } from '../../shared/palette';

/**
 * The HTML shell the WebView loads.
 *
 * It is deliberately tiny: CodeMirror, markdown-it, DOMPurify, highlight.js and
 * every stylesheet arrive inside the bundle that `npm run build:webview`
 * produces, so this file has no build-time dependencies and no asset plumbing.
 *
 * The colours are custom properties rather than values, because the theme is
 * chosen at runtime and changes while the page is already open. The values here
 * are the dark default, so the shell never flashes a light page before the
 * theme arrives.
 */
const SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  :root {
    color-scheme: dark;
    /* Transparent on purpose: the theme can be a light one, and this page is
       hidden until the theme arrives, so what shows through is the React Native
       container — already painted in the active theme. A baked-in colour here
       would flash the dark palette on every editor open. */
    --md-bg: transparent;
    --md-fg: #e6edf3;
    --md-muted: #8b949e;
  }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: var(--md-bg);
    color: var(--md-fg);
    -webkit-text-size-adjust: 100%;
  }
  .pane { position: fixed; inset: 0; }
  .pane[hidden] { display: none; }
  #editor { overflow: hidden; }
  #editor .cm-editor { height: 100%; }
  #editor .cm-editor.cm-focused { outline: none; }
  #preview { overflow: auto; -webkit-overflow-scrolling: touch; }
  #boot {
    padding: 16px;
    font: 13px/1.6 ${monoFontStack};
    color: var(--md-muted);
  }
</style>
</head>
<body>
  <div id="boot">Loading editor…</div>
  <div id="editor" class="pane" hidden></div>
  <div id="preview" class="pane" hidden></div>
  <script>__WEBVIEW_BUNDLE__</script>
</body>
</html>`;

/**
 * Inlines the WebView bundle into the shell.
 *
 * A `</script` sequence anywhere inside the bundle — in a string, a regular
 * expression, a comment — would close the `<script>` element early and destroy
 * the page, so every occurrence is rewritten to `<\/script`, which JavaScript
 * reads back as `</script>`.
 *
 * The replacement goes through a callback because the bundle is full of `$`
 * characters and `String.prototype.replace` would otherwise expand `$&`, `$'`
 * and friends inside the replacement text.
 */
export function buildWebviewHtml(bundle: string): string {
  const safeBundle = bundle.replace(/<\/script/gi, '<\\/script');
  return SHELL.replace('__WEBVIEW_BUNDLE__', () => safeBundle);
}
