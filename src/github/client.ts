import { base64ToUtf8, utf8ToBase64 } from './base64';
import { encodeRepoPath } from './paths';
import type {
  DirEntry,
  GitHubUser,
  RemoteFile,
  RepoSummary,
  WriteFileInput,
} from './types';

const API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const USER_AGENT = 'MarkdownEditor-Android';

/** GitHub's maximum page size; also how the UI knows a page might be full. */
export const REPOS_PAGE_SIZE = 100;

export type GitHubErrorKind =
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'rateLimit'
  | 'network'
  | 'unknown';

const KIND_MESSAGES: Record<GitHubErrorKind, string> = {
  auth: 'The token was rejected. Check that it is valid and has not expired.',
  forbidden:
    'The token is not allowed to do this. It needs access to the repository contents.',
  notFound:
    'Not found. The file may have been deleted, or the token may have no access to the repository.',
  conflict: 'The file changed on GitHub after you opened it.',
  rateLimit: 'GitHub rate-limited the request. Try again later.',
  network: 'No connection to GitHub. Check your internet connection.',
  unknown: 'The request to GitHub failed.',
};

export class GitHubError extends Error {
  readonly kind: GitHubErrorKind;
  readonly status: number;
  /** The API's own words, kept for diagnostics rather than for the UI. */
  readonly detail: string;

  constructor(
    kind: GitHubErrorKind,
    status: number,
    detail: string,
    message: string = KIND_MESSAGES[kind],
  ) {
    super(message);
    this.name = 'GitHubError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

type RequestOptions = {
  method?: 'GET' | 'PUT';
  body?: string;
};

type ApiUser = { login: string; name: string | null };

type ApiRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  default_branch: string;
  updated_at: string;
  owner: { login: string };
};

type ApiBranch = { name: string };

type ApiContentEntry = {
  name: string;
  path: string;
  type: DirEntry['type'];
  sha: string;
  size: number;
};

type ApiFile = {
  path: string;
  sha: string;
  size: number;
  encoding?: string;
  content?: string;
};

type ApiWriteResult = { commit?: { sha?: string } };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const repoUrl = (owner: string, repo: string): string =>
  `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

function classify(response: FetchResponse): GitHubErrorKind {
  const { status } = response;
  if (status === 401) {
    return 'auth';
  }
  if (status === 404) {
    return 'notFound';
  }
  if (status === 409 || status === 422) {
    return 'conflict';
  }
  if (status === 403 || status === 429) {
    return response.headers.get('x-ratelimit-remaining') === '0' ||
      status === 429
      ? 'rateLimit'
      : 'forbidden';
  }
  return 'unknown';
}

async function toGitHubError(response: FetchResponse): Promise<GitHubError> {
  let detail = `HTTP ${response.status}`;
  try {
    const body: unknown = await response.json();
    const message = isRecord(body) ? body.message : null;
    if (typeof message === 'string' && message.length > 0) {
      detail = message;
    }
  } catch {
    // A body that is not JSON (or is empty) leaves the default detail in place.
  }
  return new GitHubError(classify(response), response.status, detail);
}

const toRepoSummary = (repo: ApiRepo): RepoSummary => ({
  id: repo.id,
  owner: repo.owner.login,
  name: repo.name,
  fullName: repo.full_name,
  defaultBranch: repo.default_branch,
  isPrivate: repo.private,
  description: repo.description ?? null,
  updatedAt: repo.updated_at,
});

/**
 * A thin, typed wrapper over the GitHub Contents API.
 *
 * The app reads and writes files through the Contents API rather than shipping
 * a Git implementation: it is online-only and cannot merge branches, but it
 * works identically on every platform, needs no filesystem shim, and makes a
 * commit that GitHub itself authored — which is what "commit and push" means
 * for a single Markdown file.
 */
export class GitHubClient {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      Authorization: `Bearer ${this.token}`,
      'User-Agent': USER_AGENT,
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response: FetchResponse;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body,
      });
    } catch {
      throw new GitHubError('network', 0, 'fetch rejected');
    }

    if (!response.ok) {
      throw await toGitHubError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  /** Validates a token: this is the first call the app ever makes. */
  async getUser(): Promise<GitHubUser> {
    const user = await this.request<ApiUser>('/user');
    return { login: user.login, name: user.name ?? null };
  }

  async listRepos(page = 1): Promise<RepoSummary[]> {
    const repos = await this.request<ApiRepo[]>(
      `/user/repos?per_page=${REPOS_PAGE_SIZE}&page=${page}` +
        '&sort=updated&affiliation=owner,collaborator,organization_member',
    );
    return repos.map(toRepoSummary);
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const branches = await this.request<ApiBranch[]>(
      `${repoUrl(owner, repo)}/branches?per_page=${REPOS_PAGE_SIZE}`,
    );
    return branches.map(branch => branch.name);
  }

  async listDirectory(
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<DirEntry[]> {
    const suffix = path.length > 0 ? `/${encodeRepoPath(path)}` : '';
    const entries = await this.request<ApiContentEntry[] | ApiContentEntry>(
      `${repoUrl(owner, repo)}/contents${suffix}?ref=${encodeURIComponent(
        ref,
      )}`,
    );
    if (!Array.isArray(entries)) {
      throw new GitHubError(
        'unknown',
        0,
        'expected a directory listing',
        'This path is a file, not a directory.',
      );
    }
    return entries.map(entry => ({
      name: entry.name,
      path: entry.path,
      type: entry.type,
      sha: entry.sha,
      size: entry.size,
    }));
  }

  async readFile(
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<RemoteFile> {
    const file = await this.request<ApiFile>(
      `${repoUrl(owner, repo)}/contents/${encodeRepoPath(
        path,
      )}?ref=${encodeURIComponent(ref)}`,
    );
    if (file.encoding !== 'base64' || typeof file.content !== 'string') {
      throw new GitHubError(
        'unknown',
        0,
        `unexpected encoding: ${file.encoding ?? 'missing'}`,
        'The file is too large: GitHub only returns contents up to 1 MB.',
      );
    }
    return { path: file.path, sha: file.sha, text: base64ToUtf8(file.content) };
  }

  /**
   * Creates or updates a file and returns the new commit sha.
   *
   * Passing `sha` updates an existing blob; omitting it creates a file. GitHub
   * rejects the write with 409/422 when the sha is stale, which is exactly the
   * "somebody else pushed while you were editing" case the UI reports.
   */
  async writeFile(input: WriteFileInput): Promise<string> {
    const body: Record<string, string> = {
      message: input.message,
      content: utf8ToBase64(input.content),
      branch: input.branch,
    };
    if (input.sha !== undefined) {
      body.sha = input.sha;
    }
    const result = await this.request<ApiWriteResult>(
      `${repoUrl(input.owner, input.repo)}/contents/${encodeRepoPath(
        input.path,
      )}`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
    return result.commit?.sha ?? '';
  }
}
