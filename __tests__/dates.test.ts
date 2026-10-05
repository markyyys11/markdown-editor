import {formatDay} from '../src/util/dates';

describe('formatDay', () => {
  it('formats a local timestamp as дд.мм.гггг', () => {
    // Without a timezone suffix the string is parsed as local time, so this
    // assertion holds in every timezone.
    expect(formatDay('2026-10-05T12:00:00')).toBe('05.10.2026');
  });

  it('pads single-digit days and months', () => {
    expect(formatDay('2026-01-09T12:00:00')).toBe('09.01.2026');
  });

  it('keeps the right shape for a UTC timestamp', () => {
    // The exact day depends on the timezone, so only the shape is pinned.
    expect(formatDay('2026-10-05T12:00:00Z')).toMatch(/^\d{2}\.\d{2}\.2026$/);
  });

  it('returns an empty string for an unparseable value', () => {
    expect(formatDay('not a date')).toBe('');
  });
});
