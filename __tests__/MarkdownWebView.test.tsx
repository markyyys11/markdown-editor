import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { WebView } from 'react-native-webview';
import type { AppTheme } from '../shared/theme';
import { MarkdownWebView } from '../src/webview/MarkdownWebView';
import type { MarkdownWebViewHandle } from '../src/webview/MarkdownWebView';

/**
 * A class component, so React attaches the `ref` this component passes and the
 * test can observe `postMessage`. A function component would only receive a ref
 * as a prop, which is a React 19 behaviour that would make the mock depend on
 * the very thing the test is trying to hold still.
 */
jest.mock('react-native-webview', () => {
  const react = require('react');
  class MockWebView extends react.Component<Record<string, unknown>> {
    postMessage = jest.fn();
    render() {
      return react.createElement('WebView', this.props);
    }
  }
  return { WebView: MockWebView };
});

/** Only identity matters here; the values are checked by the mapping tests. */
const theme: AppTheme = {
  id: 'fixture',
  label: 'Fixture',
  mode: 'dark',
  ui: {
    canvasDefault: '#101010',
    canvasSubtle: '#181818',
    canvasInset: '#0a0a0a',
    borderDefault: '#303030',
    borderMuted: '#30303066',
    fgDefault: '#e0e0e0',
    fgMuted: '#909090',
    fgSubtle: '#606060',
    accent: '#4488ff',
    selection: '#264f78',
    danger: '#ff5555',
    success: '#44dd88',
    warning: '#ffcc33',
    info: '#4488ff',
  },
  markup: {
    heading: '#79c0ff',
    headingPunctuation: '#606060',
    bold: '#ffa657',
    italic: '#d2a8ff',
    strikethrough: '#909090',
    inlineCode: '#a5d6ff',
    fencedCode: '#a5d6ff',
    codePunctuation: '#606060',
    codeLanguage: '#a5d6ff',
    linkText: '#4488ff',
    linkUrl: '#4488ff',
    quote: '#909090',
    listMarker: '#e0e0e0',
    frontMatter: '#7ee787',
    comment: '#606060',
  },
  preview: {
    background: '#101010',
    foreground: '#e0e0e0',
    muted: '#909090',
    border: '#303030',
    link: '#58a6ff',
    quoteBackground: '#181818',
    quoteBorder: '#404040',
    codeBlockBackground: '#181818',
    inlineCodeBackground: '#181818',
    inlineCodeForeground: '#e0e0e0',
    tableHeaderBackground: '#181818',
  },
  code: { keyword: '#ff7b72', string: '#a5d6ff' },
};

type Page = {
  props: { onMessage(event: { nativeEvent: { data: string } }): void };
  postMessage: jest.Mock;
};

type MountProps = {
  document: string;
  documentKey: number;
  mode: 'edit' | 'preview';
  theme?: AppTheme;
};

function mount(props: MountProps) {
  const handlers = {
    onChangeText: jest.fn(),
    onOpenLink: jest.fn(),
    onError: jest.fn(),
  };
  const handle = React.createRef<MarkdownWebViewHandle>();
  const element = (next: MountProps) => (
    <MarkdownWebView ref={handle} theme={theme} {...next} {...handlers} />
  );
  let tree: TestRenderer.ReactTestRenderer | null = null;
  act(() => {
    tree = TestRenderer.create(element(props));
  });
  if (tree === null) {
    throw new Error('the tree was never created');
  }
  const renderer = tree as TestRenderer.ReactTestRenderer;
  const page = renderer.root.findByType(WebView).instance as unknown as Page;
  const fire = (message: unknown) => {
    act(() => {
      page.props.onMessage({ nativeEvent: { data: JSON.stringify(message) } });
    });
  };
  const posted = () =>
    page.postMessage.mock.calls.map(([raw]) => JSON.parse(String(raw)));
  const update = (next: MountProps) => {
    act(() => {
      renderer.update(element(next));
    });
  };
  return { renderer, page, fire, posted, handlers, handle, update };
}

describe('MarkdownWebView', () => {
  it('delivers a document that was supplied before the page was ready', () => {
    // The regression guard for the bug where every file opened empty: the
    // document must reach the page even though the page only announces itself
    // later, and even though it is handed over at mount time.
    const { page, fire, posted } = mount({
      document: '# Общий анализ крови',
      documentKey: 1,
      mode: 'edit',
    });

    // Nothing can be posted yet: the page has not identified itself.
    expect(page.postMessage).not.toHaveBeenCalled();

    fire({ type: 'ready' });

    expect(posted()).toEqual([
      { type: 'setTheme', theme },
      { type: 'setMode', mode: 'edit' },
      { type: 'setDocument', content: '# Общий анализ крови' },
    ]);
  });

  it('sends the theme before anything else', () => {
    // The page keeps its panes hidden until the theme arrives, so the editor
    // never paints in a palette that belongs to no theme.
    const { fire, posted } = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    expect(posted()[0]).toEqual({ type: 'setTheme', theme });
  });

  it('keeps only the newest document supplied before the page was ready', () => {
    const { update, fire, posted } = mount({
      document: 'старый текст',
      documentKey: 1,
      mode: 'edit',
    });

    update({ document: 'новый текст', documentKey: 2, mode: 'edit' });
    fire({ type: 'ready' });

    expect(posted()).toEqual([
      { type: 'setTheme', theme },
      { type: 'setMode', mode: 'edit' },
      { type: 'setDocument', content: 'новый текст' },
    ]);
  });

  it('hands the current text back when the page restarts', () => {
    // Android can reclaim the WebView renderer. The page then boots empty, so
    // what was on screen has to be restored — including edits made since the
    // file was opened, which only the page ever knew about.
    const { fire, page, posted } = mount({
      document: 'загруженный текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    fire({ type: 'change', content: 'загруженный текст и правка' });
    page.postMessage.mockClear();

    fire({ type: 'ready' });

    expect(posted()).toEqual([
      { type: 'setTheme', theme },
      { type: 'setMode', mode: 'edit' },
      { type: 'setDocument', content: 'загруженный текст и правка' },
    ]);
  });

  it('re-applies the same text when documentKey changes', () => {
    const { fire, page, posted, update } = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    page.postMessage.mockClear();

    update({ document: 'текст', documentKey: 2, mode: 'edit' });

    expect(posted()).toEqual([{ type: 'setDocument', content: 'текст' }]);
  });

  it('does not push the text back when only the mode changes', () => {
    // Typing must never be echoed to the page: the WebView owns the text while
    // it is being edited, and a re-sent document would move the caret.
    const { fire, page, posted, update } = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    page.postMessage.mockClear();

    update({ document: 'текст', documentKey: 1, mode: 'preview' });

    expect(posted()).toEqual([{ type: 'setMode', mode: 'preview' }]);
  });

  it('sends a new theme when it changes', () => {
    const other: AppTheme = { ...theme, id: 'other', mode: 'light' };
    const { fire, page, posted, update } = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    page.postMessage.mockClear();

    update({ document: 'текст', documentKey: 1, mode: 'edit', theme: other });

    expect(posted()).toEqual([{ type: 'setTheme', theme: other }]);
  });

  it('forwards a keypad tap to the page as an insert command', () => {
    const { fire, page, posted, handle } = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({ type: 'ready' });
    page.postMessage.mockClear();

    act(() => {
      handle.current?.insert({ text: '*', closer: '*' });
    });
    act(() => {
      handle.current?.insert({ text: '\t', closer: null });
    });

    expect(posted()).toEqual([
      { type: 'insert', text: '*', closer: '*' },
      { type: 'insert', text: '\t', closer: null },
    ]);
  });

  it('reports edits and link taps to the host', () => {
    const { fire, handlers } = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({ type: 'ready' });

    fire({ type: 'change', content: '# Привет' });
    fire({ type: 'openLink', href: 'https://github.com/' });

    expect(handlers.onChangeText).toHaveBeenCalledWith('# Привет');
    expect(handlers.onOpenLink).toHaveBeenCalledWith('https://github.com/');
  });

  it('ignores malformed and unknown messages', () => {
    const { page, fire, handlers } = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({ type: 'ready' });

    act(() => {
      page.props.onMessage({ nativeEvent: { data: 'not json at all' } });
    });
    fire({ type: 'nonsense' });
    fire({ type: 'change' });

    expect(handlers.onChangeText).not.toHaveBeenCalled();
    expect(handlers.onOpenLink).not.toHaveBeenCalled();
    expect(handlers.onError).not.toHaveBeenCalled();
  });
});
