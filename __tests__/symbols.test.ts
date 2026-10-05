import {MARKDOWN_SYMBOLS, TAB_TEXT} from '../src/markdown/symbols';

describe('MARKDOWN_SYMBOLS', () => {
  it('offers single characters only', () => {
    // The panel is meant to carry the characters themselves, not shortcuts like
    // `##` or `**`: how many of a character to use is the writer's decision.
    for (const {symbol} of MARKDOWN_SYMBOLS) {
      expect([...symbol]).toHaveLength(1);
    }
  });

  it('pairs each opener with a single-character closer', () => {
    for (const {closer} of MARKDOWN_SYMBOLS) {
      if (closer !== null) {
        expect([...closer]).toHaveLength(1);
      }
    }
  });

  it('pairs only the symbols that Markdown actually closes', () => {
    const paired = MARKDOWN_SYMBOLS.filter(({closer}) => closer !== null).map(
      ({symbol, closer}) => `${symbol}${closer}`,
    );
    expect(paired).toEqual(['**', '__', '~~', '``', '[]', '()', '<>']);
  });

  it('puts the closing characters of every pair on the panel too', () => {
    const available = new Set(MARKDOWN_SYMBOLS.map(({symbol}) => symbol));
    for (const {closer} of MARKDOWN_SYMBOLS) {
      if (closer !== null) {
        expect(available).toContain(closer);
      }
    }
  });

  it('keeps every symbol distinct, since the character is the key', () => {
    const symbols = MARKDOWN_SYMBOLS.map(({symbol}) => symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it('describes every key for a screen reader', () => {
    for (const {symbol, label} of MARKDOWN_SYMBOLS) {
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).not.toBe(symbol);
    }
  });

  it('inserts a real tabulation for the Tab key', () => {
    expect(TAB_TEXT).toBe('\t');
  });
});
