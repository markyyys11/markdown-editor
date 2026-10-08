import DOMPurify from 'dompurify';
import { renderMarkdownHtml } from './render';

/**
 * Raw HTML inside a document is attacker-controlled as soon as the user opens
 * somebody else's repository, and the WebView can reach `fetch` and the host
 * bridge. Everything therefore goes through DOMPurify, with `<style>` and
 * friends removed so a document cannot restyle or script the pane.
 *
 * `html` keeps the form controls, which is what makes Markdown task lists render
 * their disabled checkboxes. `mathMl` keeps the MathML KaTeX emits for formulas,
 * together with the `display`, `encoding` and `xmlns` attributes it carries.
 */
const sanitizeOptions = {
  USE_PROFILES: { html: true, mathMl: true },
  ADD_ATTR: ['target', 'rel'],
  FORBID_TAGS: [
    'style',
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'base',
    'link',
    'meta',
  ],
};

/** Renders Markdown source to sanitised HTML. Colours come from `previewCss`. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(renderMarkdownHtml(source), sanitizeOptions);
}
