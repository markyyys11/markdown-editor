/**
 * `markdown-it-task-lists` ships no type declarations of its own. The
 * signature below is the one the plugin actually implements, and it only
 * relies on markdown-it's default export so that it stays valid regardless of
 * which entry point (ESM or CJS) TypeScript resolves.
 */
declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  export interface TaskListsOptions {
    /** Render `- [ ]` / `- [x]` items as disabled checkboxes. */
    enabled?: boolean;
    /** Wrap the checkbox in a `<label>` so the whole item is clickable. */
    label?: boolean;
    /** Put the checkbox after the item text instead of before it. */
    labelAfter?: boolean;
  }

  const taskLists: (md: MarkdownIt, options?: TaskListsOptions) => void;
  export default taskLists;
}
