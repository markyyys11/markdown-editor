import type {RepoSummary} from '../github/types';

/** A Markdown document the user asked to open, with the branch to read it from. */
export type OpenedFile = {
  path: string;
  isNew: boolean;
  branch: string;
};

/**
 * The navigation stack is a list of these. Keeping the branch on the editor
 * route (rather than in shared state) means opening the same file from two
 * branches is unambiguous, and going back restores what was there before.
 */
export type Route =
  | {name: 'repos'}
  | {name: 'browse'; repo: RepoSummary; path: string}
  | {
      name: 'editor';
      repo: RepoSummary;
      branch: string;
      path: string;
      isNew: boolean;
    };
