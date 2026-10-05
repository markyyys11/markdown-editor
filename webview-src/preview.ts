import DOMPurify from 'dompurify';
import githubMarkdownCss from 'github-markdown-css/github-markdown-dark.css';
import highlightCss from 'highlight.js/styles/github-dark.css';
import {palette} from '../shared/palette';
import {renderMarkdownHtml} from './render';

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
  USE_PROFILES: {html: true},
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

/** Renders Markdown source to sanitised HTML in the GitHub dark look. */
export function renderMarkdown(source: string): string {
  return DOMPurify.sanitize(renderMarkdownHtml(source), sanitizeOptions);
}

/**
 * `github-markdown-dark.css` is literally the stylesheet GitHub serves for the
 * dark theme, so the preview matches github.com rather than approximating it.
 * The overrides below only adapt it to a phone-sized, scrollable pane.
 */
export const previewCss = `
${githubMarkdownCss}
${highlightCss}

:root { color-scheme: dark; }
html, body { background-color: ${palette.canvasDefault}; }
body { margin: 0; }

.markdown-body {
  background-color: transparent;
  padding: 12px 16px 45vh;
  font-size: 15px;
}
.markdown-body img { max-width: 100%; }
.markdown-body table { display: block; width: max-content; max-width: 100%; overflow: auto; }
.markdown-body pre { overflow: auto; }
.markdown-body .hljs { background-color: ${palette.canvasSubtle}; }
.markdown-body input[type='checkbox'] { margin: 0 0.4em 0 0; }
`;
