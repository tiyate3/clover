/** Date helpers. All day keys are local-time strings in the form YYYY-MM-DD. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Monday-first grid: null for leading blanks, otherwise the day-of-month. */
export function monthGrid(year: number, month: number): (number | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth(year, month); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function formatShortDate(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats a time of day the way the phone shows it: 24-hour ("20:00") or 12-hour ("8:00 PM").
 * `uses24hourClock` comes from the device's clock setting (expo-localization); null falls back to the locale.
 */
export function formatTime(hour: number, minute: number, uses24hourClock: boolean | null): string {
  const mm = pad(minute);
  if (uses24hourClock === true) return `${pad(hour)}:${mm}`;
  if (uses24hourClock === false) return `${hour % 12 || 12}:${mm} ${hour < 12 ? 'AM' : 'PM'}`;
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Longest run of consecutive logged days within the month (future days ignored). */
export function bestStreakInMonth(has: (key: string) => boolean, year: number, month: number): number {
  let best = 0;
  let run = 0;
  const today = todayKey();
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const key = toKey(new Date(year, month, d));
    if (key > today) break;
    run = has(key) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Consecutive logged days ending today (or yesterday, if today isn't logged yet). Pass `on` to ask about another day. */
export function currentStreak(has: (key: string) => boolean, on: Date = new Date()): number {
  const d = new Date(on);
  if (!has(toKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (has(toKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
