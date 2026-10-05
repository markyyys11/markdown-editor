module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // esbuild turns the editor font into a data URL at build time (see
    // scripts/build-webview.mjs). Jest has no loader for it, and a test that
    // imports the theme code only needs *a* string there.
    '\\.ttf$': '<rootDir>/webview-src/__mocks__/fontStub.js',
  },
};
