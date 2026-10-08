import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * The Markdown dialect GitHub renders: GFM (tables, task lists, strikethrough,
 * autolinks, footnotes), TeX math, and a sanitised subset of raw HTML
 * (`<details>` and friends).
 *
 * This module is intentionally DOM-free — no sanitising, no stylesheet imports
 * — so that the rendering behaviour can be unit tested in plain Node.
 * `preview.ts` adds the browser-only parts on top.
 *
 * Math is emitted as MathML rather than KaTeX's styled HTML: the WebView renders
 * MathML itself, so no KaTeX stylesheet or fonts have to be shipped, which keeps
 * several hundred kilobytes out of the bundle.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  // `allowDangerousHtml` keeps raw HTML in the tree and `rehype-raw` parses it;
  // sanitising happens in `preview.ts`, so `<details>` works without the
  // document having to be trusted.
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex, { output: 'mathml' })
  // `detect: false` means a fenced block is highlighted only when it names a
  // language the highlighter knows; guessing would colour plain text.
  .use(rehypeHighlight, { detect: false })
  .use(rehypeStringify);

/** Renders Markdown source to HTML. The result is *not* sanitised yet. */
export function renderMarkdownHtml(source: string): string {
  return processor.processSync(source).toString();
}
