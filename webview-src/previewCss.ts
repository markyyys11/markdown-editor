import type { AppTheme } from '../shared/theme';
import { EDITOR_FONT_STACK, fontFaceRule } from './fontFace';

/**
 * highlight.js classes, grouped by the token colour that applies to them.
 *
 * The lists do not overlap: a class that two groups could claim would be decided
 * by rule order, which is the kind of thing that looks fine until a theme makes
 * the two colours differ.
 */
const HLJS_SELECTORS: Readonly<Record<string, readonly string[]>> = {
  keyword: ['hljs-keyword', 'hljs-doctag'],
  built_in: ['hljs-built_in'],
  type: ['hljs-type', 'hljs-class', 'hljs-title.class_'],
  literal: ['hljs-literal'],
  number: ['hljs-number'],
  string: ['hljs-string', 'hljs-meta-string'],
  regexp: ['hljs-regexp'],
  comment: ['hljs-comment', 'hljs-quote'],
  meta: ['hljs-meta', 'hljs-meta-keyword'],
  title: ['hljs-title', 'hljs-title.function_', 'hljs-section'],
  function: ['hljs-function'],
  params: ['hljs-params'],
  variable: ['hljs-variable', 'hljs-template-variable'],
  attr: ['hljs-attr', 'hljs-attribute', 'hljs-property'],
  tag: ['hljs-tag'],
  name: ['hljs-name'],
  symbol: ['hljs-symbol'],
  bullet: ['hljs-bullet'],
  emphasis: ['hljs-emphasis'],
  strong: ['hljs-strong'],
  link: ['hljs-link'],
  'selector-tag': ['hljs-selector-tag'],
  'selector-class': ['hljs-selector-class'],
  'selector-id': ['hljs-selector-id'],
  operator: ['hljs-operator'],
  punctuation: ['hljs-punctuation'],
  addition: ['hljs-addition'],
  deletion: ['hljs-deletion'],
};

/** Colour rules for fenced code in the preview, from the theme's token colours. */
const codeCss = (theme: AppTheme): string => {
  const rules: string[] = [`.hljs { color: ${theme.preview.foreground}; }`];
  for (const [token, selectors] of Object.entries(HLJS_SELECTORS)) {
    const color = theme.code[token];
    if (color === undefined) {
      continue;
    }
    const style = token === 'emphasis' ? ' font-style: italic;' : '';
    const weight = token === 'strong' ? ' font-weight: 700;' : '';
    rules.push(
      `.${selectors.join(',\n.')} { color: ${color};${style}${weight} }`,
    );
  }
  return rules.join('\n');
};

/**
 * The preview stylesheet.
 *
 * Written here rather than taken from a package, because the preview follows the
 * theme's own Markdown-preview colours (`textLink`, `textBlockQuote`,
 * `textCodeBlock`, `textPreformat`) and a stylesheet with baked-in colours would
 * have to be overridden selector by selector — leaving whatever was not
 * overridden in the wrong palette, which is exactly what a light theme reveals.
 */
export const previewCss = (theme: AppTheme): string => {
  const { preview } = theme;
  const mono = `'Cascadia Mono', ui-monospace, monospace`;
  return `${fontFaceRule}

.markdown-body {
  background-color: ${preview.background};
  color: ${preview.foreground};
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  padding: 16px 20px 45vh;
  word-wrap: break-word;
}
.markdown-body > *:first-child { margin-top: 0; }
/* A first-line indent on each paragraph, as Russian typography expects. Reset
   inside blocks that already provide their own alignment or indentation. */
.markdown-body p { text-indent: 1.5em; }
.markdown-body li p,
.markdown-body blockquote p,
.markdown-body td p,
.markdown-body th p { text-indent: 0; }
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin: 22px 0 12px;
  font-weight: 600;
  line-height: 1.3;
}
.markdown-body h1 { font-size: 1.7em; padding-bottom: .3em; border-bottom: 1px solid ${
    preview.border
  }; }
.markdown-body h2 { font-size: 1.4em; padding-bottom: .3em; border-bottom: 1px solid ${
    preview.border
  }; }
.markdown-body h3 { font-size: 1.2em; }
.markdown-body h4 { font-size: 1.05em; }
.markdown-body h5, .markdown-body h6 { font-size: 1em; color: ${
    preview.muted
  }; }
.markdown-body p, .markdown-body ul, .markdown-body ol, .markdown-body dl,
.markdown-body table, .markdown-body blockquote, .markdown-body pre { margin: 0 0 14px; }
.markdown-body ul, .markdown-body ol { padding-left: 1.6em; }
.markdown-body li + li { margin-top: .25em; }
.markdown-body li > ul, .markdown-body li > ol { margin: .25em 0 0; }
.markdown-body a { color: ${preview.link}; text-decoration: none; }
.markdown-body a:active { text-decoration: underline; }
.markdown-body strong { font-weight: 700; }
.markdown-body em { font-style: italic; }
.markdown-body s, .markdown-body del { color: ${preview.muted}; }
.markdown-body blockquote {
  padding: .2em 1em;
  color: ${preview.muted};
  border-left: .25em solid ${preview.quoteBorder};
  background-color: ${preview.quoteBackground};
}
.markdown-body blockquote > *:last-child { margin-bottom: 0; }
.markdown-body code {
  font-family: ${mono};
  font-size: .9em;
  padding: .2em .4em;
  border-radius: 4px;
  background-color: ${preview.inlineCodeBackground};
  color: ${preview.inlineCodeForeground};
}
.markdown-body pre {
  padding: 12px;
  overflow: auto;
  border-radius: 6px;
  background-color: ${preview.codeBlockBackground};
}
.markdown-body pre code {
  padding: 0;
  background-color: transparent;
  color: ${preview.foreground};
  font-size: .88em;
}
.markdown-body hr {
  height: 1px;
  border: 0;
  background-color: ${preview.border};
  margin: 20px 0;
}
.markdown-body table {
  border-collapse: collapse;
  display: block;
  max-width: 100%;
  overflow: auto;
}
.markdown-body th, .markdown-body td {
  padding: 6px 13px;
  border: 1px solid ${preview.border};
}
.markdown-body th {
  background-color: ${preview.tableHeaderBackground};
  font-weight: 600;
}
/* GFM expresses column alignment as the legacy align attribute, which the
   browser no longer applies on its own for a styled table. */
.markdown-body th[align='center'], .markdown-body td[align='center'] { text-align: center; }
.markdown-body th[align='right'], .markdown-body td[align='right'] { text-align: right; }
.markdown-body img { max-width: 100%; }
.markdown-body .contains-task-list { padding-left: .4em; }
.markdown-body .task-list-item { list-style: none; }
.markdown-body input[type='checkbox'] { margin: 0 .4em 0 0; }
/* The footnotes section GitHub appends, including its screen-reader-only
   heading. */
.markdown-body .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.markdown-body .footnotes {
  margin-top: 28px;
  padding-top: 12px;
  border-top: 1px solid ${preview.border};
  font-size: .92em;
  color: ${preview.muted};
}
.markdown-body .footnotes ol { padding-left: 1.4em; }
.markdown-body .footnotes li + li { margin-top: .4em; }
/* Formulas arrive as MathML, which the WebView draws itself; only the size and
   the layout of display math need a hand. */
.markdown-body .katex { font-size: 1.05em; }
.markdown-body .katex:has(> math[display='block']) {
  display: block;
  margin: 14px 0;
  text-align: center;
}

${codeCss(theme)}`;
};

/** The editor's own font, so the CodeMirror scroller and code agree. */
export const editorFontStack = EDITOR_FONT_STACK;
