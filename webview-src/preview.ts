import DOMPurify from 'dompurify';
import { renderMarkdownHtml } from './render';

/**
 * Raw HTML inside a document is attacker-controlled as soon as the user opens
 * somebody else's repository, and the WebView can reach `fetch` and the host
 * bridge. Everything therefore goes through DOMPurify, with `<style>` and
 * friends removed so a document cannot restyle or script the pane.
 *
 * `USE_PROFILES.html` keeps form controls, which is what makes Markdown task
 * lists render their disabled checkboxes.
 */
const sanitizeOptions = {
  USE_PROFILES: { html: true },
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
