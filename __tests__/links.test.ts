import { normalizeRepoPath, resolveLink } from '../src/github/links';

const REPO = 'https://github.com/Altey/lab-docs';
const BRANCH = 'main';

describe('normalizeRepoPath', () => {
  it('collapses dot segments', () => {
    expect(normalizeRepoPath('docs/./api//v2.md')).toBe('docs/api/v2.md');
  });

  it('resolves parent segments', () => {
    expect(normalizeRepoPath('docs/api/../intro.md')).toBe('docs/intro.md');
  });

  it('cannot climb above the repository root', () => {
    expect(normalizeRepoPath('../../secrets.md')).toBe('secrets.md');
  });

  it('maps the root to an empty path', () => {
    expect(normalizeRepoPath('')).toBe('');
  });
});

describe('resolveLink', () => {
  it('ignores in-page anchors', () => {
    expect(resolveLink('#section', 'docs/intro.md', REPO, BRANCH)).toEqual({
      kind: 'ignored',
    });
  });

  it('ignores empty hrefs', () => {
    expect(resolveLink('   ', 'docs/intro.md', REPO, BRANCH)).toEqual({
      kind: 'ignored',
    });
  });

  it('passes absolute URLs through untouched', () => {
    expect(
      resolveLink('https://example.com/a.md', 'docs/intro.md', REPO, BRANCH),
    ).toEqual({
      kind: 'external',
      url: 'https://example.com/a.md',
    });
  });

  it('treats mailto: as an external URL', () => {
    expect(resolveLink('mailto:lab@example.com', 'a.md', REPO, BRANCH)).toEqual(
      {
        kind: 'external',
        url: 'mailto:lab@example.com',
      },
    );
  });

  it('opens a sibling Markdown document in the editor', () => {
    expect(resolveLink('setup.md', 'docs/intro.md', REPO, BRANCH)).toEqual({
      kind: 'markdown',
      path: 'docs/setup.md',
    });
  });

  it('resolves ../ against the containing directory', () => {
    expect(resolveLink('../guide.md', 'docs/api/v2.md', REPO, BRANCH)).toEqual({
      kind: 'markdown',
      path: 'docs/guide.md',
    });
  });

  it('resolves a repository-absolute Markdown link', () => {
    expect(resolveLink('/README.md', 'docs/intro.md', REPO, BRANCH)).toEqual({
      kind: 'markdown',
      path: 'README.md',
    });
  });

  it('drops the fragment before deciding', () => {
    expect(
      resolveLink('setup.md#install', 'docs/intro.md', REPO, BRANCH),
    ).toEqual({
      kind: 'markdown',
      path: 'docs/setup.md',
    });
  });

  it('sends non-Markdown targets to github.com', () => {
    expect(resolveLink('img/logo.png', 'docs/intro.md', REPO, BRANCH)).toEqual({
      kind: 'external',
      url: `${REPO}/blob/${BRANCH}/docs/img/logo.png`,
    });
  });

  it('encodes the branch and the path of a non-Markdown target', () => {
    const resolved = resolveLink(
      'общий анализ.pdf',
      'docs/заказы.md',
      REPO,
      'feature/итоги',
    );
    expect(resolved).toEqual({
      kind: 'external',
      url: `${REPO}/blob/feature%2F%D0%B8%D1%82%D0%BE%D0%B3%D0%B8/docs/%D0%BE%D0%B1%D1%89%D0%B8%D0%B9%20%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7.pdf`,
    });
  });

  it('resolves percent-encoded Markdown links', () => {
    expect(
      resolveLink('%D0%BE%D0%B1%D1%89%D0%B8%D0%B9.md', '', REPO, BRANCH),
    ).toEqual({ kind: 'markdown', path: 'общий.md' });
  });

  it('ignores a link that is only a query string', () => {
    expect(resolveLink('?plain=1', 'a.md', REPO, BRANCH)).toEqual({
      kind: 'ignored',
    });
  });
});
