const fs = require('fs');
const path = require('path');

/**
 * The preview stack (unified, remark, rehype and their many small helpers) ships
 * as ESM: esbuild bundles it happily, but Jest transforms nothing under
 * node_modules unless the package is named in `transformIgnorePatterns`.
 *
 * The names come from the dependency closure rather than being typed out by
 * hand, so a plugin upgrade that pulls in another helper keeps working. The
 * whole closure is allowed, not only the packages that declare
 * `"type": "module"`: npm nests a second, ESM copy of a package under whichever
 * dependency needs it (`mdast-util-find-and-replace` carries its own
 * `escape-string-regexp`), the decision here is made by package *name*, and
 * transforming a CommonJS package too is harmless.
 */
const PREVIEW_ENTRY_PACKAGES = [
  'unified',
  'remark-parse',
  'remark-gfm',
  'remark-math',
  'remark-rehype',
  'rehype-raw',
  'rehype-katex',
  'rehype-highlight',
  'rehype-stringify',
];

function collectDependencyNames(entries) {
  const visited = new Set();
  const queue = [...entries];
  while (queue.length > 0) {
    const name = queue.pop();
    if (visited.has(name)) {
      continue;
    }
    visited.add(name);
    let manifest;
    try {
      manifest = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, 'node_modules', name, 'package.json'),
          'utf8',
        ),
      );
    } catch {
      // Not an installed package: a Node built-in, an alias, and so on.
      continue;
    }
    queue.push(...Object.keys(manifest.dependencies ?? {}));
    queue.push(...Object.keys(manifest.peerDependencies ?? {}));
  }
  return visited;
}

const escapeForRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The React Native names come from the preset's own pattern, which this one
// replaces; dropping them would stop react-native itself being transformed.
const transformable = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  ...[...collectDependencyNames(PREVIEW_ENTRY_PACKAGES)].map(escapeForRegExp),
].join('|');

module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // esbuild turns the editor font into a data URL at build time (see
    // scripts/build-webview.mjs). Jest has no loader for it, and a test that
    // imports the theme code only needs *a* string there.
    '\\.ttf$': '<rootDir>/webview-src/__mocks__/fontStub.js',
  },
  transformIgnorePatterns: [`node_modules/(?!(${transformable})/)`],
};
