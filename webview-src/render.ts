import hljs from 'highlight.js/lib/common';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

/**
 * The Markdown dialect GitHub renders: tables, strikethrough, autolinks, task
 * lists, and a sanitised subset of raw HTML (`<details>` and friends).
 *
 * This module is intentionally DOM-free — no sanitising, no stylesheet
 * imports — so that the rendering behaviour can be unit tested in plain Node.
 * `preview.ts` adds the browser-only parts on top.
 */
const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  highlight: (code, lang) => {
    if (!lang || !hljs.getLanguage(lang)) {
      // An empty string tells markdown-it to emit escaped, unhighlighted code.
      return '';
    }
    try {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true })
        .value;
    } catch {
      return '';
    }
  },
  // `enabled: false` makes the plugin emit `disabled` checkboxes, which is what
  // GitHub renders when you view a Markdown file in a repository. The name of
  // the option is inverse to its meaning: `enabled: true` would make them
  // interactive, as they are in issues and pull requests.
}).use(taskLists, { enabled: false });

/** Renders Markdown source to HTML. The result is *not* sanitised yet. */
export function renderMarkdownHtml(source: string): string {
  return markdown.render(source);
}
