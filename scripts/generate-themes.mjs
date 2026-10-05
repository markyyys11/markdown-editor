/**
 * Builds `src/themes/generated/themes.ts` from the VSCode extension installed on
 * this machine.
 *
 * The output is committed, so the app builds anywhere and without VSCode: the
 * extension is only needed to regenerate. Point the script elsewhere with a
 * first argument if VSCode lives somewhere unusual:
 *
 *   node scripts/generate-themes.mjs [extensions-dir]
 *
 * The mapping itself lives in `src/themes/mapVscodeTheme.ts`, which the tests
 * call as well, so the rules exist in exactly one place.
 */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'src', 'themes', 'generated', 'themes.ts');

const extensionsDir =
  process.argv[2] ??
  process.env.VSCODE_EXTENSIONS_DIR ??
  path.join(process.env.USERPROFILE ?? '', '.vscode', 'extensions');

if (!existsSync(extensionsDir)) {
  console.error(`No extensions directory at ${extensionsDir}`);
  process.exit(1);
}

const extensionFolder = readdirSync(extensionsDir)
  .filter(name => /^beardedbear\.beardedtheme-/.test(name))
  .sort()
  .pop();

if (extensionFolder === undefined) {
  console.error(
    `beardedbear.beardedtheme is not installed in ${extensionsDir}`,
  );
  process.exit(1);
}

const extensionDir = path.join(extensionsDir, extensionFolder);
const manifest = JSON.parse(
  readFileSync(path.join(extensionDir, 'package.json'), 'utf8'),
);
const contributed = manifest.contributes?.themes ?? [];
console.log(`extension: ${extensionFolder}`);
console.log(`themes contributed: ${contributed.length}`);

// Map the module under test for Node rather than importing TypeScript directly.
const bundled = path.join(root, '.qwen', 'tmp', 'mapVscodeTheme.cjs');
mkdirSync(path.dirname(bundled), { recursive: true });
await build({
  entryPoints: [path.join(root, 'src', 'themes', 'mapVscodeTheme.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundled,
  logLevel: 'warning',
});
const { mapVscodeTheme, slugFromFileName } = createRequire(import.meta.url)(
  bundled,
);

/** GitHub Dark, the app's original look, kept as a theme of its own. */
const GITHUB_DARK = {
  id: 'github-dark',
  label: 'GitHub Dark',
  mode: 'dark',
  ui: {
    canvasDefault: '#0d1117',
    canvasSubtle: '#161b22',
    canvasInset: '#010409',
    borderDefault: '#30363d',
    borderMuted: '#21262d',
    fgDefault: '#e6edf3',
    fgMuted: '#8b949e',
    fgSubtle: '#6e7681',
    accent: '#2f81f7',
    selection: '#264f78',
    danger: '#f85149',
    success: '#3fb950',
    warning: '#d29922',
    info: '#2f81f7',
  },
  markup: {
    heading: '#79c0ff',
    headingPunctuation: '#6e7681',
    bold: '#ffa657',
    italic: '#d2a8ff',
    strikethrough: '#8b949e',
    inlineCode: '#a5d6ff',
    fencedCode: '#a5d6ff',
    codePunctuation: '#6e7681',
    codeLanguage: '#a5d6ff',
    linkText: '#2f81f7',
    linkUrl: '#2f81f7',
    quote: '#8b949e',
    listMarker: '#e6edf3',
    frontMatter: '#7ee787',
    comment: '#6e7681',
  },
  preview: {
    background: '#0d1117',
    foreground: '#e6edf3',
    muted: '#8b949e',
    border: '#30363d',
    link: '#58a6ff',
    quoteBackground: '#161b22',
    quoteBorder: '#3b434b',
    codeBlockBackground: '#161b22',
    inlineCodeBackground: '#161b22',
    inlineCodeForeground: '#e6edf3',
    tableHeaderBackground: '#161b22',
  },
  code: {
    keyword: '#ff7b72',
    built_in: '#ffa657',
    type: '#ffa657',
    literal: '#79c0ff',
    number: '#79c0ff',
    string: '#a5d6ff',
    regexp: '#a5d6ff',
    comment: '#8b949e',
    meta: '#8b949e',
    title: '#d2a8ff',
    function: '#d2a8ff',
    params: '#ffa657',
    variable: '#ffa657',
    attr: '#79c0ff',
    tag: '#7ee787',
    symbol: '#a5d6ff',
    bullet: '#ffa657',
    emphasis: '#ffa657',
    strong: '#ffa657',
    link: '#a5d6ff',
    addition: '#aff5b4',
    deletion: '#ffdcd7',
    operator: '#ff7b72',
    punctuation: '#e6edf3',
    section: '#79c0ff',
  },
};

const themes = [GITHUB_DARK];
const problems = [];

for (const entry of contributed) {
  const file = path.join(extensionDir, entry.path.replace(/^\.\//, ''));
  if (!existsSync(file)) {
    problems.push(`missing file for ${entry.label}: ${entry.path}`);
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    problems.push(`unreadable JSON for ${entry.label}: ${error.message}`);
    continue;
  }
  themes.push(
    mapVscodeTheme(parsed, {
      id: slugFromFileName(path.basename(entry.path)),
      label: entry.label,
      mode: entry.uiTheme === 'vs' ? 'light' : 'dark',
    }),
  );
}

const ids = new Set(themes.map(theme => theme.id));
if (ids.size !== themes.length) {
  problems.push('duplicate theme ids');
}

const banner = `/* eslint-disable */
// GENERATED FILE — do not edit by hand.
// Source: ${extensionFolder} (${contributed.length} contributed themes)
// Regenerate with: node scripts/generate-themes.mjs
`;
const body = `${banner}
import type {AppTheme} from '../types';

export const THEMES: readonly AppTheme[] = ${JSON.stringify(themes, null, 2)};

/** The theme selected on first launch: the one this machine's VSCode uses. */
export const DEFAULT_THEME_ID = 'monokai-black';

export const THEME_SOURCE = ${JSON.stringify(
  {
    extension: extensionFolder,
    contributed: contributed.length,
    total: themes.length,
  },
  null,
  2,
)};
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, body, 'utf8');

const dark = themes.filter(theme => theme.mode === 'dark').length;
console.log(
  `wrote ${themes.length} themes (${dark} dark, ${
    themes.length - dark
  } light) to ${path.relative(root, outputPath)}`,
);
console.log(
  `file size: ${(Buffer.byteLength(body, 'utf8') / 1024).toFixed(1)} KiB`,
);
for (const problem of problems) {
  console.log(`PROBLEM: ${problem}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
