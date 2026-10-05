import type {InsertRequest} from '../shared/protocol';

/** A change to apply, in the coordinates CodeMirror expects for a transaction. */
export type InsertPlan = {
  /** Omitted when the key only moves the caret and changes nothing. */
  changes?: {from: number; to: number; insert: string};
  selection: {anchor: number; head: number};
};

export type InsertInput = {
  /** Start of the selection. */
  from: number;
  /** End of the selection; equal to `from` when nothing is selected. */
  to: number;
  /** The selected text, which is empty when the caret is collapsed. */
  selected: string;
  /**
   * The text immediately after the caret, read only as far as the closing text
   * is long. Everything after the document's end reads as an empty string.
   */
  next: string;
  request: InsertRequest;
};

/**
 * Decides what tapping a keypad key does to the document.
 *
 * Kept pure — numbers and strings rather than an EditorState — because the
 * editing rules are the part most worth testing and this is the only way to
 * reach them without a DOM. The rules are:
 *
 * - a symbol with no pair replaces whatever is selected;
 * - a paired symbol wraps the selection and leaves the wrapped text selected,
 *   so tapping `*` twice turns the word into `**word**`;
 * - with a collapsed caret the pair is inserted and the caret lands between the
 *   two characters;
 * - unless the closing character is already right after the caret, in which case
 *   the caret steps over it instead of typing a second one.
 */
export function planInsert({
  from,
  to,
  selected,
  next,
  request,
}: InsertInput): InsertPlan {
  const {text, closer} = request;

  if (closer === null) {
    const caret = from + text.length;
    return {
      changes: {from, to, insert: text},
      selection: {anchor: caret, head: caret},
    };
  }

  if (selected.length > 0) {
    const start = from + text.length;
    return {
      changes: {from, to, insert: `${text}${selected}${closer}`},
      selection: {anchor: start, head: to + text.length},
    };
  }

  if (next === closer) {
    const caret = from + closer.length;
    return {selection: {anchor: caret, head: caret}};
  }

  const caret = from + text.length;
  return {
    changes: {from, to, insert: `${text}${closer}`},
    selection: {anchor: caret, head: caret},
  };
}
