import { encodeRepoPath, isMarkdownPath, parentRepoPath } from './paths';

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const FRAGMENT_OR_QUERY = /[?#].*$/;

export type ResolvedLink =
  /** A URL to hand to the system browser or another app. */
  | { kind: 'external'; url: string }
  /** A Markdown document in the same repository; open it in the editor. */
  | { kind: 'markdown'; path: string }
  /** An in-page anchor, or something with nothing to open. */
  | { kind: 'ignored' };

/** Collapses `.` and `..`; a `..` at the root cannot escape the repository. */
export function normalizeRepoPath(path: string): string {
  const segments: string[] = [];
  for (const segment of path.split('/')) {
    if (segment.length === 0 || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

/**
 * Decides what a link in the preview should do.
 *
 * GitHub resolves relative links against the file they appear in, so
 * `../guide.md` from `docs/intro.md` must lead to `guide.md` in the editor
 * rather than to a browser 404.
 */
export function resolveLink(
  href: string,
  fromPath: string,
  repoWebUrl: string,
  branch: string,
): ResolvedLink {
  const target = href.trim();
  if (target.length === 0 || target.startsWith('#')) {
    return { kind: 'ignored' };
  }
  if (HAS_SCHEME.test(target)) {
    return { kind: 'external', url: target };
  }

  const withoutFragment = target.replace(FRAGMENT_OR_QUERY, '');
  if (withoutFragment.length === 0) {
    return { kind: 'ignored' };
  }

  let decoded = withoutFragment;
  try {
    decoded = decodeURIComponent(withoutFragment);
  } catch {
    // A malformed percent-escape is not worth failing over; use it verbatim.
  }

  const base = decoded.startsWith('/') ? '' : parentRepoPath(fromPath);
  const resolved = normalizeRepoPath(
    base.length > 0 ? `${base}/${decoded}` : decoded,
  );

  if (isMarkdownPath(resolved)) {
    return { kind: 'markdown', path: resolved };
  }
  return {
    kind: 'external',
    url: `${repoWebUrl}/blob/${encodeURIComponent(branch)}/${encodeRepoPath(
      resolved,
    )}`,
  };
}
