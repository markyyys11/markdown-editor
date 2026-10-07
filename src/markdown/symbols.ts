export type MarkdownSymbol = {
  /** The character shown on the key and inserted at the caret. */
  symbol: string;
  /**
   * Closing character when the symbol comes in pairs, otherwise `null`. The
   * editor inserts both and leaves the caret between them.
   */
  closer: string | null;
  /** What the character is for; the character alone is not a usable label. */
  label: string;
};

/**
 * Every single character that carries meaning in Markdown.
 *
 * Multi-character shortcuts are deliberately absent: `#` is a heading whether
 * it is tapped once or six times, so the panel only has to offer the character
 * and the user decides how many. The closing characters of pairs are listed
 * separately as well, for the few cases where one is wanted on its own.
 */
export const MARKDOWN_SYMBOLS: readonly MarkdownSymbol[] = [
  { symbol: '#', closer: null, label: 'Heading' },
  { symbol: '*', closer: '*', label: 'Italic or bold' },
  { symbol: '_', closer: '_', label: 'Italic' },
  { symbol: '~', closer: '~', label: 'Strikethrough' },
  { symbol: '`', closer: '`', label: 'Code' },
  { symbol: '>', closer: null, label: 'Quote' },
  { symbol: '-', closer: null, label: 'List item' },
  { symbol: '+', closer: null, label: 'List item' },
  { symbol: '=', closer: null, label: 'Heading underline' },
  { symbol: '|', closer: null, label: 'Table column' },
  { symbol: '!', closer: null, label: 'Image' },
  { symbol: '[', closer: ']', label: 'Link' },
  { symbol: ']', closer: null, label: 'Link end' },
  { symbol: '(', closer: ')', label: 'Link target' },
  { symbol: ')', closer: null, label: 'Target end' },
  { symbol: '<', closer: '>', label: 'HTML' },
  { symbol: '\\', closer: null, label: 'Escape' },
];

/** What the Tab key inserts: a literal tabulation, as Markdown code blocks use. */
export const TAB_TEXT = '\t';
