import {utf8ToBase64} from '../src/github/base64';
import {GitHubClient, GitHubError} from '../src/github/client';
import type {GitHubErrorKind} from '../src/github/client';

type FakeResponse = {
  ok: boolean;
  status: number;
  headers: {get(name: string): string | null};
  json(): Promise<unknown>;
};

type CapturedRequest = {
  url: string;
  init?: {
    method?: string;
    headers: Record<string, string>;
    body?: string;
  };
};

const respond = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): FakeResponse => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {get: name => headers[name.toLowerCase()] ?? null},
  json: async () => body,
});

let fetchMock: jest.Mock;
const originalFetch: typeof fetch = globalThis.fetch;

beforeEach(() => {
  fetchMock = jest.fn();
  (globalThis as unknown as {fetch: typeof fetch}).fetch =
    fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  (globalThis as unknown as {fetch: typeof fetch}).fetch = originalFetch;
});

const lastRequest = (): CapturedRequest => {
  const {calls} = fetchMock.mock;
  const [url, init] = calls[calls.length - 1];
  return {url, init};
};

const bodyOf = (): Record<string, unknown> =>
  JSON.parse(String(lastRequest().init?.body)) as Record<string, unknown>;

const client = (): GitHubClient => new GitHubClient('pat-123');

const failureOf = async (run: Promise<unknown>): Promise<GitHubError> => {
  const failure = await run.catch((error: unknown) => error);
  expect(failure).toBeInstanceOf(GitHubError);
  return failure as GitHubError;
};

describe('readFile', () => {
  it('requests the blob at the ref and decodes Cyrillic content', async () => {
    const text = '# Общий анализ крови\n\nГемоглобин: 140 г/л\n';
    fetchMock.mockResolvedValueOnce(
      respond({
        path: 'docs/анализ.md',
        sha: 'blob-1',
        size: 1234,
        encoding: 'base64',
        content: utf8ToBase64(text),
      }),
    );

    const file = await client().readFile('Altey', 'lab-docs', 'docs/анализ.md', 'main');

    expect(file).toEqual({path: 'docs/анализ.md', sha: 'blob-1', text});
    const {url, init} = lastRequest();
    expect(url).toBe(
      'https://api.github.com/repos/Altey/lab-docs/contents/docs/%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7.md?ref=main',
    );
    expect(init?.method).toBe('GET');
    expect(init?.headers.Authorization).toBe('Bearer pat-123');
    expect(init?.headers.Accept).toBe('application/vnd.github+json');
    expect(init?.headers['X-GitHub-Api-Version']).toBe('2022-11-28');
  });

  it('explains the 1 MB limit when GitHub sends no content', async () => {
    fetchMock.mockResolvedValueOnce(
      respond({path: 'huge.md', sha: 's', size: 2_000_000, encoding: 'none'}),
    );

    const failure = await failureOf(client().readFile('o', 'r', 'huge.md', 'main'));

    expect(failure.message).toMatch(/1 МБ/);
  });
});

describe('writeFile', () => {
  it('PUTs base64 content, the branch and the blob sha', async () => {
    fetchMock.mockResolvedValueOnce(respond({commit: {sha: 'commit-9'}}));

    const commitSha = await client().writeFile({
      owner: 'Altey',
      repo: 'lab-docs',
      path: 'docs/анализ.md',
      branch: 'main',
      message: 'Update docs/анализ.md',
      content: 'Новый текст',
      sha: 'blob-1',
    });

    expect(commitSha).toBe('commit-9');
    const {url, init} = lastRequest();
    expect(url).toBe(
      'https://api.github.com/repos/Altey/lab-docs/contents/docs/%D0%B0%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7.md',
    );
    expect(init?.method).toBe('PUT');
    expect(init?.headers['Content-Type']).toBe('application/json');
    expect(bodyOf()).toEqual({
      message: 'Update docs/анализ.md',
      content: utf8ToBase64('Новый текст'),
      branch: 'main',
      sha: 'blob-1',
    });
  });

  it('omits sha when the file is new', async () => {
    fetchMock.mockResolvedValueOnce(respond({commit: {sha: 'commit-1'}}));

    await client().writeFile({
      owner: 'o',
      repo: 'r',
      path: 'new.md',
      branch: 'main',
      message: 'Create new.md',
      content: '',
    });

    expect('sha' in bodyOf()).toBe(false);
  });
});

describe('listing', () => {
  it('paginates repositories', async () => {
    fetchMock.mockResolvedValueOnce(respond([]));
    await client().listRepos(3);
    expect(lastRequest().url).toBe(
      'https://api.github.com/user/repos?per_page=100&page=3' +
        '&sort=updated&affiliation=owner,collaborator,organization_member',
    );
  });

  it('maps a repository payload onto the domain shape', async () => {
    fetchMock.mockResolvedValueOnce(
      respond([
        {
          id: 7,
          name: 'lab-docs',
          full_name: 'Altey/lab-docs',
          private: true,
          description: null,
          default_branch: 'develop',
          updated_at: '2026-10-01T09:00:00Z',
          owner: {login: 'Altey'},
        },
      ]),
    );

    const [repo] = await client().listRepos();

    expect(repo).toEqual({
      id: 7,
      owner: 'Altey',
      name: 'lab-docs',
      fullName: 'Altey/lab-docs',
      defaultBranch: 'develop',
      isPrivate: true,
      description: null,
      updatedAt: '2026-10-01T09:00:00Z',
    });
  });

  it('reads a directory listing at a ref', async () => {
    fetchMock.mockResolvedValueOnce(
      respond([
        {name: 'docs', path: 'docs', type: 'dir', sha: 'd1', size: 0},
        {name: 'README.md', path: 'README.md', type: 'file', sha: 'f1', size: 120},
      ]),
    );

    const entries = await client().listDirectory('Altey', 'lab-docs', '', 'develop');

    expect(entries).toHaveLength(2);
    expect(entries[1]).toEqual({
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      sha: 'f1',
      size: 120,
    });
    expect(lastRequest().url).toBe(
      'https://api.github.com/repos/Altey/lab-docs/contents?ref=develop',
    );
  });

  it('reports a file where a directory was expected', async () => {
    fetchMock.mockResolvedValueOnce(
      respond({name: 'a.md', path: 'a.md', type: 'file', sha: 'x', size: 1}),
    );

    const failure = await failureOf(
      client().listDirectory('Altey', 'lab-docs', 'a.md', 'main'),
    );

    expect(failure.message).toMatch(/каталог/);
  });

  it('lists branch names', async () => {
    fetchMock.mockResolvedValueOnce(respond([{name: 'main'}, {name: 'develop'}]));

    await expect(client().listBranches('Altey', 'lab-docs')).resolves.toEqual([
      'main',
      'develop',
    ]);
  });
});

describe('error classification', () => {
  const cases: ReadonlyArray<[number, GitHubErrorKind]> = [
    [401, 'auth'],
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [422, 'conflict'],
    [500, 'unknown'],
  ];

  it.each(cases)('maps HTTP %i to %s', async (status, kind) => {
    fetchMock.mockResolvedValueOnce(respond({message: 'from the API'}, status));

    const failure = await failureOf(client().getUser());

    expect(failure.kind).toBe(kind);
    expect(failure.status).toBe(status);
  });

  it('maps a spent rate limit to rateLimit, not forbidden', async () => {
    fetchMock.mockResolvedValueOnce(
      respond({message: 'API rate limit exceeded'}, 403, {
        'x-ratelimit-remaining': '0',
      }),
    );

    const failure = await failureOf(client().getUser());

    expect(failure.kind).toBe('rateLimit');
  });

  it('maps a rejected fetch to network', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));

    const failure = await failureOf(client().getUser());

    expect(failure.kind).toBe('network');
    expect(failure.status).toBe(0);
  });

  it('keeps the API message for diagnostics while showing Russian to the user', async () => {
    fetchMock.mockResolvedValueOnce(respond({message: 'Bad credentials'}, 401));

    const failure = await failureOf(client().getUser());

    expect(failure.detail).toBe('Bad credentials');
    expect(failure.message).toMatch(/Токен отклонён/);
  });

  it('survives an error body that is not JSON', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      headers: {get: () => null},
      json: async () => {
        throw new Error('not json');
      },
    });

    const failure = await failureOf(client().getUser());

    expect(failure.kind).toBe('unknown');
    expect(failure.detail).toBe('HTTP 502');
  });
});
