import { renderMarkdownHtml } from '../render';

/**
 * These assertions pin the promise made for preview mode: the same constructs
 * GitHub renders are the constructs we render. They run in plain Node, which is
 * why `render.ts` keeps DOMPurify and the stylesheets out of the way.
 */
describe('renderMarkdownHtml', () => {
  it('renders GFM tables with header cells', () => {
    const html = renderMarkdownHtml(
      [
        '| Показатель | Значение |',
        '| --- | ---: |',
        '| Гемоглобин | 140 |',
      ].join('\n'),
    );
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Показатель</th>');
    expect(html).toContain('<td style="text-align:right">140</td>');
  });

  it('renders strikethrough and inline code', () => {
    const html = renderMarkdownHtml('~~устарело~~ и `КОД`');
    expect(html).toContain('<s>устарело</s>');
    expect(html).toContain('<code>КОД</code>');
  });

  it('renders task lists as the disabled checkboxes GitHub shows for a file', () => {
    const html = renderMarkdownHtml('- [x] готово\n- [ ] в работе');
    expect(html).toContain('contains-task-list');
    expect(html).toContain('task-list-item');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('checked=""');
  });

  it('highlights fenced code when the language is known', () => {
    const html = renderMarkdownHtml('```json\n{"a": 1}\n```');
    expect(html).toContain('class="hljs');
    expect(html).toContain('language-json');
  });

  it('leaves unknown fenced languages escaped and unhighlighted', () => {
    const html = renderMarkdownHtml(
      '```nosuchlang\n<script>alert(1)</script>\n```',
    );
    expect(html).toContain('language-nosuchlang');
    expect(html).not.toContain('hljs-');
    expect(html).toContain('&lt;script&gt;');
  });

  it('keeps raw HTML so that <details> works like it does on GitHub', () => {
    const html = renderMarkdownHtml(
      '<details><summary>Ещё</summary>текст</details>',
    );
    expect(html).toContain('<details>');
    expect(html).toContain('<summary>Ещё</summary>');
  });

  it('autolinks bare URLs', () => {
    const html = renderMarkdownHtml('см. https://github.com/');
    expect(html).toContain('<a href="https://github.com/"');
  });

  it('renders headings, blockquotes and lists', () => {
    const html = renderMarkdownHtml('# Заголовок\n\n> цитата\n\n- раз\n- два');
    expect(html).toContain('<h1');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>раз</li>');
  });

  it('leaves the document text verbatim, Cyrillic included', () => {
    const html = renderMarkdownHtml('Исследование: **общий анализ крови**');
    expect(html).toContain('Исследование: ');
    expect(html).toContain('<strong>общий анализ крови</strong>');
  });
});
