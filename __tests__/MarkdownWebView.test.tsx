import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {WebView} from 'react-native-webview';
import {MarkdownWebView} from '../src/webview/MarkdownWebView';
import type {MarkdownWebViewHandle} from '../src/webview/MarkdownWebView';

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
  return {WebView: MockWebView};
});

type Page = {
  props: {onMessage(event: {nativeEvent: {data: string}}): void};
  postMessage: jest.Mock;
};

function mount(props: {
  document: string;
  documentKey: number;
  mode: 'edit' | 'preview';
}) {
  const handlers = {
    onChangeText: jest.fn(),
    onOpenLink: jest.fn(),
    onError: jest.fn(),
  };
  const handle = React.createRef<MarkdownWebViewHandle>();
  let tree: TestRenderer.ReactTestRenderer | null = null;
  act(() => {
    tree = TestRenderer.create(
      <MarkdownWebView ref={handle} {...props} {...handlers} />,
    );
  });
  if (tree === null) {
    throw new Error('the tree was never created');
  }
  const page = (tree as TestRenderer.ReactTestRenderer).root.findByType(WebView)
    .instance as unknown as Page;
  const fire = (message: unknown) => {
    act(() => {
      page.props.onMessage({nativeEvent: {data: JSON.stringify(message)}});
    });
  };
  const posted = () =>
    page.postMessage.mock.calls.map(([raw]) => JSON.parse(String(raw)));
  return {
    tree: tree as TestRenderer.ReactTestRenderer,
    page,
    fire,
    posted,
    handlers,
    handle,
  };
}

describe('MarkdownWebView', () => {
  it('delivers a document that was supplied before the page was ready', () => {
    // The regression guard for the bug where every file opened empty: the
    // document must reach the page even though the page only announces itself
    // later, and even though it is handed over at mount time.
    const {page, fire, posted} = mount({
      document: '# Общий анализ крови',
      documentKey: 1,
      mode: 'edit',
    });

    // Nothing can be posted yet: the page has not identified itself.
    expect(page.postMessage).not.toHaveBeenCalled();

    fire({type: 'ready'});

    expect(posted()).toEqual([
      {type: 'setMode', mode: 'edit'},
      {type: 'setDocument', content: '# Общий анализ крови'},
    ]);
  });

  it('keeps only the newest document supplied before the page was ready', () => {
    const {tree, fire, posted} = mount({
      document: 'старый текст',
      documentKey: 1,
      mode: 'edit',
    });

    act(() => {
      tree.update(
        <MarkdownWebView
          document="новый текст"
          documentKey={2}
          mode="edit"
          onChangeText={jest.fn()}
          onOpenLink={jest.fn()}
          onError={jest.fn()}
        />,
      );
    });

    fire({type: 'ready'});

    expect(posted()).toEqual([
      {type: 'setMode', mode: 'edit'},
      {type: 'setDocument', content: 'новый текст'},
    ]);
  });

  it('hands the current text back when the page restarts', () => {
    // Android can reclaim the WebView renderer. The page then boots empty, so
    // what was on screen has to be restored — including edits made since the
    // file was opened, which only the page ever knew about.
    const {fire, page, posted} = mount({
      document: 'загруженный текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({type: 'ready'});
    fire({type: 'change', content: 'загруженный текст и правка'});
    page.postMessage.mockClear();

    fire({type: 'ready'});

    expect(posted()).toEqual([
      {type: 'setMode', mode: 'edit'},
      {type: 'setDocument', content: 'загруженный текст и правка'},
    ]);
  });

  it('re-applies the same text when documentKey changes', () => {
    const {tree, fire, page, posted} = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({type: 'ready'});
    page.postMessage.mockClear();

    act(() => {
      tree.update(
        <MarkdownWebView
          document="текст"
          documentKey={2}
          mode="edit"
          onChangeText={jest.fn()}
          onOpenLink={jest.fn()}
          onError={jest.fn()}
        />,
      );
    });

    expect(posted()).toEqual([{type: 'setDocument', content: 'текст'}]);
  });

  it('does not push the text back when only the mode changes', () => {
    // Typing must never be echoed to the page: the WebView owns the text while
    // it is being edited, and a re-sent document would move the caret.
    const {tree, fire, page, posted} = mount({
      document: 'текст',
      documentKey: 1,
      mode: 'edit',
    });
    fire({type: 'ready'});
    page.postMessage.mockClear();

    act(() => {
      tree.update(
        <MarkdownWebView
          document="текст"
          documentKey={1}
          mode="preview"
          onChangeText={jest.fn()}
          onOpenLink={jest.fn()}
          onError={jest.fn()}
        />,
      );
    });

    expect(posted()).toEqual([{type: 'setMode', mode: 'preview'}]);
  });

  it('forwards a keypad tap to the page as an insert command', () => {
    const {fire, page, posted, handle} = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({type: 'ready'});
    page.postMessage.mockClear();

    act(() => {
      handle.current?.insert({text: '*', closer: '*'});
    });
    act(() => {
      handle.current?.insert({text: '\t', closer: null});
    });

    expect(posted()).toEqual([
      {type: 'insert', text: '*', closer: '*'},
      {type: 'insert', text: '\t', closer: null},
    ]);
  });

  it('reports edits and link taps to the host', () => {
    const {fire, handlers} = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({type: 'ready'});

    fire({type: 'change', content: '# Привет'});
    fire({type: 'openLink', href: 'https://github.com/'});

    expect(handlers.onChangeText).toHaveBeenCalledWith('# Привет');
    expect(handlers.onOpenLink).toHaveBeenCalledWith('https://github.com/');
  });

  it('ignores malformed and unknown messages', () => {
    const {page, fire, handlers} = mount({
      document: '',
      documentKey: 0,
      mode: 'edit',
    });
    fire({type: 'ready'});

    act(() => {
      page.props.onMessage({nativeEvent: {data: 'not json at all'}});
    });
    fire({type: 'nonsense'});
    fire({type: 'change'});

    expect(handlers.onChangeText).not.toHaveBeenCalled();
    expect(handlers.onOpenLink).not.toHaveBeenCalled();
    expect(handlers.onError).not.toHaveBeenCalled();
  });
});
