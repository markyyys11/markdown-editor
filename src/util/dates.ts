const pad = (value: number): string => (value < 10 ? `0${value}` : String(value));

/**
 * Formats an ISO timestamp as `дд.мм.гггг`.
 *
 * Written out rather than delegated to `toLocaleDateString`, so the output does
 * not depend on whether the Hermes build ships the full ICU data.
 */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
