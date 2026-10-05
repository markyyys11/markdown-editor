import { DEFAULT_THEME_ID, THEMES } from '../src/themes/generated/themes';
import {
  mapVscodeTheme,
  resolveScope,
  slugFromFileName,
  withAlpha,
} from '../src/themes/mapVscodeTheme';
import type { VscodeThemeJson } from '../src/themes/mapVscodeTheme';

/** A miniature theme, shaped like the real ones, for the mapping rules. */
const fixture: VscodeThemeJson = {
  colors: {
    'editor.background': '#101820',
    'editor.foreground': '#eeeeee',
    'sideBar.background': '#0c1219',
    'panel.background': '#0a0f15',
    'panel.border': '#22303c',
    descriptionForeground: '#8899aa',
    'editorLineNumber.foreground': '#556677',
    'textLink.foreground': '#44aaff',
    'editor.selectionBackground': '#264f78',
    'editorError.foreground': '#ff5555',
    'gitDecoration.addedResourceForeground': '#44dd88',
    'editorWarning.foreground': '#ffcc33',
    'textBlockQuote.background': '#182430',
    'textBlockQuote.border': '#44aaffaa',
    'textCodeBlock.background': '#141e28',
    'textPreformat.background': '#243040',
    'textPreformat.foreground': '#ffddaa',
  },
  tokenColors: [
    {
      scope: ['markup.bold'],
      settings: { fontStyle: 'bold', foreground: '#ff7788' },
    },
    {
      scope: ['markup.italic'],
      settings: { fontStyle: 'italic', foreground: '#ffaa55' },
    },
    {
      scope: [
        'markup.inline.raw.string.markdown',
        'punctuation.definition.raw.markdown',
      ],
      settings: { foreground: '#bb99ff' },
    },
    { scope: ['markup.underline.link'], settings: { foreground: '#44aaff' } },
    { scope: ['string.other.link'], settings: { foreground: '#66dd99' } },
    { scope: ['entity.name.section'], settings: { foreground: '#ffdd66' } },
    {
      scope: ['punctuation.definition.heading'],
      settings: { foreground: '#ffdd66' },
    },
    { scope: ['markup.quote'], settings: { foreground: '#ff88ee' } },
    {
      scope: ['comment'],
      settings: { fontStyle: 'italic', foreground: '#556677' },
    },
    { scope: 'keyword', settings: { foreground: '#ffdd66' } },
    { scope: 'string', settings: { foreground: '#66dd99' } },
    { scope: 'constant.numeric', settings: { foreground: '#ffaa55' } },
    // A selector for another language, which must never answer for Markdown.
    {
      scope: ['punctuation.definition.list.begin.python'],
      settings: { foreground: '#ff0000' },
    },
  ],
};

const mapped = mapVscodeTheme(fixture, {
  id: 'fixture',
  label: 'Fixture',
  mode: 'dark',
});

describe('resolveScope', () => {
  it('applies a selector that is a prefix of the token scope', () => {
    const entries = [{ selectors: ['markup.bold'], foreground: '#111111' }];
    expect(resolveScope(entries, 'markup.bold.markdown')).toBe('#111111');
  });

  it('prefers the longest matching selector', () => {
    const entries = [
      { selectors: ['markup'], foreground: '#aaaaaa' },
      { selectors: ['markup.bold'], foreground: '#bbbbbb' },
    ];
    expect(resolveScope(entries, 'markup.bold.markdown')).toBe('#bbbbbb');
  });

  it('ignores a selector that only shares a prefix of the text', () => {
    // `markup.bolding` is not a prefix of `markup.bold.markdown` at a dot
    // boundary, and treating it as one would colour tokens at random.
    const entries = [{ selectors: ['markup.bold'], foreground: '#cccccc' }];
    expect(resolveScope(entries, 'markup.bolding.markdown')).toBeUndefined();
  });

  it("does not let another language's selector answer", () => {
    const entries = [
      {
        selectors: ['punctuation.definition.list.begin.python'],
        foreground: '#ff0000',
      },
    ];
    expect(
      resolveScope(entries, 'punctuation.definition.list.begin.markdown'),
    ).toBeUndefined();
  });

  it('ignores compound selectors, which match token chains rather than one scope', () => {
    const entries = [
      {
        selectors: ['markup.bold punctuation.definition.bold'],
        foreground: '#123456',
      },
    ];
    expect(resolveScope(entries, 'markup.bold.markdown')).toBeUndefined();
  });
});

describe('mapVscodeTheme', () => {
  it('takes the chrome colours from the theme keys', () => {
    expect(mapped.ui.canvasDefault).toBe('#101820');
    expect(mapped.ui.canvasSubtle).toBe('#0c1219');
    expect(mapped.ui.fgDefault).toBe('#eeeeee');
    expect(mapped.ui.accent).toBe('#44aaff');
    expect(mapped.ui.danger).toBe('#ff5555');
    expect(mapped.ui.success).toBe('#44dd88');
    expect(mapped.ui.warning).toBe('#ffcc33');
  });

  it('derives the hairline colour from the border', () => {
    expect(mapped.ui.borderMuted).toBe(withAlpha('#22303c', '66'));
  });

  it('resolves every Markdown role from the theme scopes', () => {
    expect(mapped.markup.heading).toBe('#ffdd66');
    expect(mapped.markup.bold).toBe('#ff7788');
    expect(mapped.markup.italic).toBe('#ffaa55');
    expect(mapped.markup.inlineCode).toBe('#bb99ff');
    expect(mapped.markup.linkUrl).toBe('#44aaff');
    expect(mapped.markup.linkText).toBe('#66dd99');
    expect(mapped.markup.quote).toBe('#ff88ee');
    expect(mapped.markup.comment).toBe('#556677');
  });

  it('gives a role the dimmed colour when the theme does not colour its marks', () => {
    expect(mapped.markup.listMarker).toBe('#556677');
  });

  it('takes the preview colours from the Markdown-preview keys', () => {
    expect(mapped.preview.link).toBe('#44aaff');
    expect(mapped.preview.quoteBorder).toBe('#44aaffaa');
    expect(mapped.preview.codeBlockBackground).toBe('#141e28');
    expect(mapped.preview.inlineCodeForeground).toBe('#ffddaa');
  });

  it('maps code classes for the preview from the same token scopes', () => {
    expect(mapped.code.keyword).toBe('#ffdd66');
    expect(mapped.code.string).toBe('#66dd99');
    expect(mapped.code.number).toBe('#ffaa55');
    expect(mapped.code.comment).toBe('#556677');
  });

  it('falls back rather than inventing a colour when a key is absent', () => {
    const bare = mapVscodeTheme(
      {},
      { id: 'bare', label: 'Bare', mode: 'light' },
    );
    expect(bare.ui.canvasDefault).toBe('#ffffff');
    expect(bare.ui.fgDefault).toBe('#1f1f1f');
    expect(
      Object.values(bare.ui).every(color => /^#[0-9a-fA-F]{3,8}$/.test(color)),
    ).toBe(true);
  });

  it('takes the light fallbacks for a light theme and the dark ones otherwise', () => {
    const light = mapVscodeTheme({}, { id: 'l', label: 'L', mode: 'light' });
    const dark = mapVscodeTheme({}, { id: 'd', label: 'D', mode: 'dark' });
    expect(light.ui.canvasDefault).not.toBe(dark.ui.canvasDefault);
  });
});

describe('slugFromFileName', () => {
  it('turns a theme file name into an id', () => {
    expect(slugFromFileName('bearded-theme-monokai-black.json')).toBe(
      'monokai-black',
    );
    expect(slugFromFileName('bearded-theme-Black-&-Gold.json')).toBe(
      'black-&-gold',
    );
  });
});

describe('withAlpha', () => {
  it('appends alpha to six-digit colours and expands three-digit ones', () => {
    expect(withAlpha('#112233', '80')).toBe('#11223380');
    expect(withAlpha('#abc', '80')).toBe('#aabbcc80');
  });

  it('replaces an existing alpha instead of stacking one', () => {
    expect(withAlpha('#11223344', '80')).toBe('#11223380');
  });

  it('leaves anything that is not a colour alone', () => {
    expect(withAlpha('transparent', '80')).toBe('transparent');
  });
});

describe('the generated theme table', () => {
  it('holds every contributed theme plus the app default', () => {
    expect(THEMES.length).toBeGreaterThan(60);
    expect(THEMES.map(theme => theme.id)).toContain('github-dark');
  });

  it('has unique ids', () => {
    const ids = THEMES.map(theme => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('starts on a theme that exists', () => {
    expect(THEMES.map(theme => theme.id)).toContain(DEFAULT_THEME_ID);
  });

  it('includes light themes as well as dark ones', () => {
    expect(THEMES.some(theme => theme.mode === 'light')).toBe(true);
    expect(THEMES.some(theme => theme.mode === 'dark')).toBe(true);
  });

  it('gives every theme a complete, valid colour set', () => {
    for (const theme of THEMES) {
      expect(Object.keys(theme.markup)).toHaveLength(15);
      expect(Object.keys(theme.code).length).toBeGreaterThanOrEqual(12);
      const colours = [
        ...Object.values(theme.ui),
        ...Object.values(theme.markup),
        ...Object.values(theme.preview),
        ...Object.values(theme.code),
      ];
      for (const colour of colours) {
        expect(colour).toMatch(
          /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
        );
      }
    }
  });

  it('keeps text readable against the background of every theme', () => {
    // A mapping that grabbed the wrong key shows up as a theme whose text is
    // invisible, which is worth catching here rather than on a phone.
    const luminance = (colour: string): number => {
      const body = colour.slice(1);
      const full =
        body.length === 3
          ? [...body].map(character => character + character).join('')
          : body.slice(0, 6);
      const [r, g, b] = [0, 2, 4].map(
        at => parseInt(full.slice(at, at + 2), 16) / 255,
      );
      const channel = (value: number): number =>
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    for (const theme of THEMES) {
      const contrast = Math.abs(
        luminance(theme.ui.canvasDefault) - luminance(theme.ui.fgDefault),
      );
      expect(`${theme.id}:${contrast > 0.25}`).toBe(`${theme.id}:true`);
    }
  });
});
