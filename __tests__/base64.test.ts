import { base64ToUtf8, utf8ToBase64 } from '../src/github/base64';

/**
 * `Buffer` is the oracle here: Node encodes UTF-8 correctly by definition, so
 * comparing against it tests the codec instead of restating my own arithmetic
 * in a hand-computed constant.
 *
 * Declared locally rather than by adding `@types/node` to the project: the app
 * runs on Hermes, and pulling Node's globals into the app's type environment
 * would silently accept Node-only APIs in `src/`.
 */
declare const Buffer: {
  from(input: string, encoding: string): { toString(encoding: string): string };
};

const expected = (text: string): string =>
  Buffer.from(text, 'utf8').toString('base64');

describe('utf8ToBase64', () => {
  it('matches Buffer for Cyrillic text', () => {
    expect(utf8ToBase64('Привет')).toBe(expected('Привет'));
  });

  it('matches Buffer for ASCII, including the padding cases', () => {
    for (const text of ['', 'a', 'ab', 'abc', 'abcd']) {
      expect(utf8ToBase64(text)).toBe(expected(text));
    }
  });

  it('matches Buffer for characters outside the BMP', () => {
    expect(utf8ToBase64('анализ 🧪 完成')).toBe(expected('анализ 🧪 完成'));
  });

  it('preserves a lone surrogate instead of throwing', () => {
    const lone = `a\uD83Db`;
    expect(base64ToUtf8(utf8ToBase64(lone))).toBe(lone);
  });
});

describe('base64ToUtf8', () => {
  it('round-trips text through encode and decode', () => {
    const text = [
      '# Общий анализ крови',
      '',
      '| Показатель | Значение |',
      '| --- | ---: |',
      '| Гемоглобин | 140 г/л |',
      '',
      'См. https://github.com/ — и **важно**.',
    ].join('\n');
    expect(base64ToUtf8(utf8ToBase64(text))).toBe(text);
  });

  it('accepts the line-wrapped base64 the Contents API returns', () => {
    const text = 'Повторяющийся текст для переноса строк. '.repeat(8);
    const wrapped = expected(text).replace(/(.{60})/g, '$1\n');
    expect(wrapped).toContain('\n');
    expect(base64ToUtf8(wrapped)).toBe(text);
  });

  it('accepts the URL-safe alphabet', () => {
    const text = 'ÿÿ?>>';
    const urlSafe = expected(text).replace(/\+/g, '-').replace(/\//g, '_');
    expect(base64ToUtf8(urlSafe)).toBe(text);
  });

  it('returns an empty string for empty input', () => {
    expect(base64ToUtf8('')).toBe('');
  });
});
