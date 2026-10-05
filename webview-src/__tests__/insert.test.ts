import {planInsert} from '../insert';

/** Convenience: a collapsed caret at `at` in a document ending at `at`. */
const at = (position: number, next = '') => ({
  from: position,
  to: position,
  selected: '',
  next,
});

describe('planInsert', () => {
  it('replaces the selection for a symbol that has no pair', () => {
    expect(
      planInsert({
        from: 2,
        to: 6,
        selected: 'старое',
        next: '',
        request: {text: '#', closer: null},
      }),
    ).toEqual({
      changes: {from: 2, to: 6, insert: '#'},
      selection: {anchor: 3, head: 3},
    });
  });

  it('puts a paired symbol around a selection and keeps it selected', () => {
    // `word` → `*word*`, still selected, so a second tap gives `**word**`.
    expect(
      planInsert({
        from: 0,
        to: 4,
        selected: 'word',
        next: '',
        request: {text: '*', closer: '*'},
      }),
    ).toEqual({
      changes: {from: 0, to: 4, insert: '*word*'},
      selection: {anchor: 1, head: 5},
    });
  });

  it('inserts a pair at a collapsed caret with the caret between', () => {
    expect(at(3).from).toBe(3);
    expect(
      planInsert({...at(3), request: {text: '`', closer: '`'}}),
    ).toEqual({
      changes: {from: 3, to: 3, insert: '``'},
      selection: {anchor: 4, head: 4},
    });
  });

  it('steps over a closing character that is already there', () => {
    // Caret between the two backticks of an empty code span: tapping the key
    // again should leave the span, not build a second one inside it.
    expect(
      planInsert({...at(4, '`'), request: {text: '`', closer: '`'}}),
    ).toEqual({selection: {anchor: 5, head: 5}});
  });

  it('inserts a pair when the next character is something else', () => {
    expect(
      planInsert({...at(0, 'x'), request: {text: '[', closer: ']'}}),
    ).toEqual({
      changes: {from: 0, to: 0, insert: '[]'},
      selection: {anchor: 1, head: 1},
    });
  });

  it('inserts a pair when the next text is too short to be the closer', () => {
    // At the very end of the document there is nothing to compare against, so
    // the pair has to be typed.
    expect(planInsert({...at(9, ''), request: {text: '~', closer: '~'}})).toEqual({
      changes: {from: 9, to: 9, insert: '~~'},
      selection: {anchor: 10, head: 10},
    });
  });

  it('never moves the caret backwards', () => {
    const plan = planInsert({
      from: 5,
      to: 5,
      selected: '',
      next: '',
      request: {text: '>', closer: null},
    });
    expect(plan.selection.anchor).toBeGreaterThanOrEqual(5);
  });
});
