/**
 * Stands in for the editor font when a test imports the WebView theme code.
 *
 * esbuild replaces this import with a data URL at build time
 * (see scripts/build-webview.mjs); Jest has no such loader, and no test needs
 * the actual font bytes.
 */
module.exports = 'data:font/ttf;base64,STUB';
