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
  { symbol: '#', closer: null, label: 'Заголовок' },
  { symbol: '*', closer: '*', label: 'Курсив или жирный' },
  { symbol: '_', closer: '_', label: 'Курсив' },
  { symbol: '~', closer: '~', label: 'Зачёркнутый' },
  { symbol: '`', closer: '`', label: 'Код' },
  { symbol: '>', closer: null, label: 'Цитата' },
  { symbol: '-', closer: null, label: 'Пункт списка' },
  { symbol: '+', closer: null, label: 'Пункт списка' },
  { symbol: '=', closer: null, label: 'Подчёркивание заголовка' },
  { symbol: '|', closer: null, label: 'Столбец таблицы' },
  { symbol: '!', closer: null, label: 'Изображение' },
  { symbol: '[', closer: ']', label: 'Ссылка' },
  { symbol: ']', closer: null, label: 'Конец ссылки' },
  { symbol: '(', closer: ')', label: 'Адрес ссылки' },
  { symbol: ')', closer: null, label: 'Конец адреса' },
  { symbol: '<', closer: '>', label: 'HTML' },
  { symbol: '\\', closer: null, label: 'Экранирование' },
];

/** What the Tab key inserts: a literal tabulation, as Markdown code blocks use. */
export const TAB_TEXT = '\t';
