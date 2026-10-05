/** Domain types for the GitHub REST API surface this app uses. */

export type GitHubUser = {
  login: string;
  name: string | null;
};

export type RepoSummary = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string | null;
  updatedAt: string;
};

export type DirEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  /** Blob sha; required when overwriting a file. */
  sha: string;
  size: number;
};

export type RemoteFile = {
  path: string;
  sha: string;
  text: string;
};

export type WriteFileInput = {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  message: string;
  /** Plain text; the client takes care of base64 encoding. */
  content: string;
  /** Blob sha being replaced. Omit when creating a new file. */
  sha?: string;
};
