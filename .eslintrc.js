module.exports = {
  root: true,
  extends: '@react-native',
  // Produced by `npm run build:webview` and `npm run themes`: a minified bundle
  // and generated data, not source.
  ignorePatterns: ['src/webview/bundle.generated.ts', 'src/themes/generated'],
  rules: {
    // `void somePromise()` marks a deliberate fire-and-forget call and reads
    // better at the call site than a bare floating promise.
    'no-void': ['warn', {allowAsStatement: true}],
  },
};
