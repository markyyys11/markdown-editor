import { parseWebviewMessage } from '../shared/protocol';

describe('parseWebviewMessage', () => {
  it('accepts a ready message', () => {
    expect(parseWebviewMessage({ type: 'ready' })).toEqual({ type: 'ready' });
  });

  it('accepts a document change and keeps the text intact', () => {
    expect(
      parseWebviewMessage({ type: 'change', content: '# Привет\n' }),
    ).toEqual({
      type: 'change',
      content: '# Привет\n',
    });
  });

  it('accepts a link tap and an error report', () => {
    expect(
      parseWebviewMessage({ type: 'openLink', href: 'https://x.dev' }),
    ).toEqual({
      type: 'openLink',
      href: 'https://x.dev',
    });
    expect(parseWebviewMessage({ type: 'error', message: 'boom' })).toEqual({
      type: 'error',
      message: 'boom',
    });
  });

  it('drops anything that does not match the contract', () => {
    const rejected = [
      null,
      undefined,
      42,
      'ready',
      [],
      {},
      { type: 7 },
      { type: 'unknown' },
      { type: 'change' },
      { type: 'change', content: 1 },
      { type: 'openLink' },
      { type: 'error', message: null },
    ];
    for (const value of rejected) {
      expect(parseWebviewMessage(value)).toBeNull();
    }
  });
});
