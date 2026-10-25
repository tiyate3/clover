import { bestStreakInMonth, toKey } from './dates';
import { countsForStreak, Entries, isLuckyDay, Item } from './store';

export type Moment = { day: string; item: Item };

export type MonthStats = {
  /** Days with at least one entry. */
  clovers: number;
  /** Longest run of days that count toward a streak (see countsForStreak). */
  bestStreak: number;
  /** Days with at least one extra-lucky entry. */
  goldClovers: number;
  /** Each gold day with its extra-lucky entries, oldest first. */
  goldDays: { day: string; items: Item[] }[];
  /** Every entry this month: extra-lucky ones first, then by date. */
  moments: Moment[];
};

export function monthStats(entries: Entries, year: number, month: number): MonthStats {
  const prefix = toKey(new Date(year, month, 1)).slice(0, 8); // "YYYY-MM-"
  const days = Object.keys(entries)
    .filter((k) => k.startsWith(prefix))
    .sort();
  const goldDays = days
    .filter((d) => isLuckyDay(entries[d]))
    .map((day) => ({ day, items: entries[day].filter((i) => i.extraLucky) }));
  const moments = days
    .flatMap((day) => entries[day].map((item) => ({ day, item })))
    .sort((a, b) => Number(b.item.extraLucky) - Number(a.item.extraLucky));

  return {
    clovers: days.length,
    bestStreak: bestStreakInMonth((k) => countsForStreak(k, entries[k]), year, month),
    goldClovers: goldDays.length,
    goldDays,
    moments,
  };
}
