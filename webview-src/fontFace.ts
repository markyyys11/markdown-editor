import cascadiaMono from './assets/CascadiaMono.ttf';

/**
 * The font the editor and code blocks use.
 *
 * Cascadia Mono, the SIL OFL successor to the Consolas that this project's
 * VSCode actually renders with. It is a variable font, so this one file covers
 * every weight — bold is real rather than synthesised — and its Cyrillic
 * coverage was checked before it was bundled, since every document in this app
 * is in Russian.
 */
export const EDITOR_FONT_FAMILY = 'Cascadia Mono';

/** Everything after the family name, in the order the browser should try. */
export const EDITOR_FONT_STACK = `'${EDITOR_FONT_FAMILY}', ui-monospace, 'Roboto Mono', 'Droid Sans Mono', monospace`;

/**
 * The `@font-face` rule carrying the font itself.
 *
 * `font-weight: 100 900` describes the variable axis; without the range the
 * browser would synthesise bold instead of asking the font for it.
 */
export const fontFaceRule = `@font-face {
  font-family: '${EDITOR_FONT_FAMILY}';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(${cascadiaMono}) format('truetype-variations');
}`;
