import {buildWebviewHtml} from '../src/webview/html';

describe('buildWebviewHtml', () => {
  it('inlines the bundle into the script element', () => {
    const html = buildWebviewHtml('var answer = 42;');
    expect(html).toContain('<script>var answer = 42;</script>');
    expect(html).not.toContain('__WEBVIEW_BUNDLE__');
  });

  it('provides the panes the bundle mounts into', () => {
    const html = buildWebviewHtml('/*bundle*/');
    expect(html).toContain('id="editor"');
    expect(html).toContain('id="preview"');
    expect(html).toContain('id="boot"');
  });

  it('paints the dark backdrop before the bundle runs', () => {
    const html = buildWebviewHtml('/*bundle*/');
    expect(html).toContain('color-scheme: dark');
    expect(html).toContain('#0d1117');
  });

  it('escapes a closing script tag so the element is not terminated early', () => {
    const html = buildWebviewHtml('var s = "</script>";');
    expect(html).not.toContain('</script>";');
    expect(html).toContain('<\\/script>');
    // The escaped spelling is the very same string once a JS parser reads it.
    expect(JSON.parse('"<\\/script>"')).toBe('</script>');
  });

  it('does not let dollar signs in the bundle expand as replacement patterns', () => {
    // `$&`, `` $` ``, `$'` and `$1` are all special to String.replace, and a
    // minified bundle is full of dollar signs.
    const bundle = "const t = '$& $` $' $1 $$';";
    const html = buildWebviewHtml(bundle);
    expect(html).toContain(bundle);
    expect(html).not.toContain('__WEBVIEW_BUNDLE__');
  });

  it('inserts the bundle only once', () => {
    const html = buildWebviewHtml('marker');
    expect(html.split('<script>').length).toBe(2);
  });
});
