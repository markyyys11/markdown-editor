/** Helpers for repository paths, which GitHub treats as plain `/`-joined text. */

const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdown', '.mkd', '.mkdn'];

/**
 * Percent-encodes every segment of a repository path while keeping the `/`
 * separators, which is what the Contents API expects. `a b/c#d.md` becomes
 * `a%20b/c%23d.md`; without this a `#` in a file name truncates the URL.
 */
export function encodeRepoPath(path: string): string {
  return path
    .split('/')
    .filter(segment => segment.length > 0)
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

/** Appends a child to a repository path, tolerating a missing or root parent. */
export function joinRepoPath(parent: string, child: string): string {
  const base = parent.replace(/^\/+|\/+$/g, '');
  return base.length === 0 ? child : `${base}/${child}`;
}

/** The containing directory of a path; the repository root is `''`. */
export function parentRepoPath(path: string): string {
  const separator = path.lastIndexOf('/');
  return separator < 0 ? '' : path.slice(0, separator);
}

/** The last segment of a path. */
export function baseName(path: string): string {
  const separator = path.lastIndexOf('/');
  return separator < 0 ? path : path.slice(separator + 1);
}

/**
 * Whether a path is a Markdown document. Only these are editable: the editor
 * would silently mangle YAML, JSON, or source files it cannot round-trip.
 */
export function isMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase();
  return MARKDOWN_EXTENSIONS.some(extension => lower.endsWith(extension));
}

/** Builds a display title for a route, collapsing the root to the repo name. */
export function displayPath(path: string): string {
  return path.length === 0 ? 'Корень репозитория' : path;
}
