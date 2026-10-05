import {
  baseName,
  displayPath,
  encodeRepoPath,
  isMarkdownPath,
  joinRepoPath,
  parentRepoPath,
} from '../src/github/paths';

describe('encodeRepoPath', () => {
  it('keeps the separators and encodes each segment', () => {
    expect(encodeRepoPath('docs/api/README.md')).toBe('docs/api/README.md');
  });

  it('escapes characters that would change the URL', () => {
    expect(encodeRepoPath('заказы/общий анализ.md')).toBe(
      '%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D1%8B/%D0%BE%D0%B1%D1%89%D0%B8%D0%B9%20%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7.md',
    );
  });

  it('escapes a hash, which would otherwise truncate the path', () => {
    expect(encodeRepoPath('notes/a#b.md')).toBe('notes/a%23b.md');
  });

  it('collapses redundant slashes and maps the root to an empty path', () => {
    expect(encodeRepoPath('/docs//intro.md/')).toBe('docs/intro.md');
    expect(encodeRepoPath('')).toBe('');
    expect(encodeRepoPath('/')).toBe('');
  });
});

describe('joinRepoPath', () => {
  it('joins a child onto a directory', () => {
    expect(joinRepoPath('docs/api', 'v2.md')).toBe('docs/api/v2.md');
  });

  it('treats the root as no prefix', () => {
    expect(joinRepoPath('', 'README.md')).toBe('README.md');
    expect(joinRepoPath('/', 'README.md')).toBe('README.md');
  });
});

describe('parentRepoPath', () => {
  it('returns the containing directory', () => {
    expect(parentRepoPath('docs/api/v2.md')).toBe('docs/api');
  });

  it('returns the root for a top-level file', () => {
    expect(parentRepoPath('README.md')).toBe('');
  });
});

describe('baseName', () => {
  it('returns the last segment', () => {
    expect(baseName('docs/api/v2.md')).toBe('v2.md');
    expect(baseName('README.md')).toBe('README.md');
  });
});

describe('isMarkdownPath', () => {
  it('accepts the Markdown extensions, case-insensitively', () => {
    for (const path of ['a.md', 'a.MD', 'docs/b.markdown', 'c.mkd', 'd.mkdn', 'e.mdown']) {
      expect(isMarkdownPath(path)).toBe(true);
    }
  });

  it('rejects everything else, including lookalikes', () => {
    for (const path of ['a.yaml', 'a.json', 'md', 'd.md.bak', 'scripts/build.sh']) {
      expect(isMarkdownPath(path)).toBe(false);
    }
  });
});

describe('displayPath', () => {
  it('names the repository root', () => {
    expect(displayPath('')).toBe('Корень репозитория');
    expect(displayPath('docs')).toBe('docs');
  });
});
