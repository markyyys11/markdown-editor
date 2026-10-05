import {monoFontStack, palette} from '../../shared/palette';

/**
 * The HTML shell the WebView loads.
 *
 * It is deliberately tiny: CodeMirror, markdown-it, DOMPurify, highlight.js and
 * both stylesheets all arrive inside the bundle that
 * `npm run build:webview` produces, so this file has no build-time
 * dependencies and no asset plumbing.
 */
const SHELL = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  :root { color-scheme: dark; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: ${palette.canvasDefault};
    color: ${palette.fgDefault};
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
    color: ${palette.fgMuted};
  }
</style>
</head>
<body>
  <div id="boot">Загрузка редактора…</div>
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
 * reads back as `</script`.
 *
 * The replacement goes through a callback because the bundle is full of `$`
 * characters and `String.prototype.replace` would otherwise expand `$&`, `$'`
 * and friends inside the replacement text.
 */
export function buildWebviewHtml(bundle: string): string {
  const safeBundle = bundle.replace(/<\/script/gi, '<\\/script');
  return SHELL.replace('__WEBVIEW_BUNDLE__', () => safeBundle);
}
