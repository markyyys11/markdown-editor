/**
 * esbuild is configured with `loader: {'.ttf': 'dataurl'}` (see
 * scripts/build-webview.mjs), so importing a font gives back a `data:` URL that
 * can be dropped straight into CSS. That is what makes the editor font work
 * offline inside the WebView with no asset plumbing.
 */
declare module '*.ttf' {
  const dataUrl: string;
  export default dataUrl;
}
