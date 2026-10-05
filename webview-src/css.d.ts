/**
 * esbuild is configured with `loader: {'.css': 'text'}` (see
 * scripts/build-webview.mjs), so every stylesheet import resolves to its raw
 * text. These declarations describe that behaviour to TypeScript.
 */

declare module 'github-markdown-css/github-markdown-dark.css' {
  const content: string;
  export default content;
}

declare module 'highlight.js/styles/github-dark.css' {
  const content: string;
  export default content;
}
