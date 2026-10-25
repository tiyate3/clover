import { TodayCloverWidget, type TodayCloverWidgetProps } from '@/components/TodayCloverWidget';
import { currentStreak, formatMonth, monthGrid, toKey, WEEKDAYS } from '@/lib/dates';
import { countsForStreak, isLuckyDay } from '@/lib/store';
import type { Entries } from '@/lib/store';
import type { Palette } from '@/lib/themes';
import {
  CloverLockScreenWidget,
  CloverMiniCalendarWidget,
  CloverStreakWidget,
  CloverWeekStripWidget,
  type CalendarCell,
  type MiniCalendarProps,
  type StreakProps,
  type WeekDay,
  type WeekStripProps,
} from './CloverWidgets';

/** How many upcoming midnights to schedule, so widgets roll over even if the app isn't opened for a while. */
const MIDNIGHTS_AHEAD = 7;

type Snapshot = {
  today: TodayCloverWidgetProps;
  streak: StreakProps;
  week: WeekStripProps;
  calendar: MiniCalendarProps;
};

/** What every widget should show at a given moment, from the entries saved so far. */
function snapshotAt(at: Date, entries: Entries, palette: Palette, hasPlus: boolean): Snapshot {
  const today = toKey(at);
  const todayLogged = (entries[today] ?? []).length > 0;
  const theme = {
    background: palette.background,
    surface: palette.surface,
    text: palette.text,
    muted: palette.muted,
    cloverFill: palette.cloverFill,
    cloverStroke: palette.cloverStroke,
    gold: palette.gold,
    locked: !hasPlus,
  };

  const days: WeekDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(at.getFullYear(), at.getMonth(), at.getDate() - (6 - index));
    const key = toKey(date);
    const items = entries[key] ?? [];
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      day: String(date.getDate()),
      logged: items.length > 0,
      lucky: isLuckyDay(items),
    };
  });

  const year = at.getFullYear();
  const month = at.getMonth();
  const cells: CalendarCell[] = monthGrid(year, month).map((day) => {
    // Widget props can't contain null (see CloverWidgets.tsx), so blank cells are day 0.
    if (day === null) return { day: 0, logged: false, lucky: false, future: false, today: false };
    const key = toKey(new Date(year, month, day));
    const items = entries[key] ?? [];
    return { day, logged: items.length > 0, lucky: isLuckyDay(items), future: key > today, today: key === today };
  });
  // Always six rows, so the large widget keeps the same layout from month to month.
  while (cells.length < 42) cells.push({ day: 0, logged: false, lucky: false, future: false, today: false });

  const todayItems = entries[today] ?? [];
  return {
    today: {
      logged: todayLogged,
      count: Math.min(3, todayItems.length),
      lucky: isLuckyDay(todayItems),
      gold: palette.gold,
      goldStroke: palette.goldStroke,
      background: palette.background,
      text: palette.text,
      muted: palette.muted,
      cloverFill: palette.cloverFill,
      cloverStroke: palette.cloverStroke,
    },
    streak: { ...theme, streak: currentStreak((key) => countsForStreak(key, entries[key]), at) },
    week: { ...theme, days, todayLogged },
    calendar: { ...theme, month: formatMonth(year, month), weekdays: WEEKDAYS, cells },
  };
}

/**
 * Publishes the latest data to every widget. Each one gets a timeline: what to show now, then
 * what to show at each of the next midnights (a fresh, unlogged day), so the Home Screen and
 * Lock Screen stay right without the app running.
 */
export function syncCloverWidgets(entries: Entries, palette: Palette, hasPlus: boolean) {
  const now = new Date();
  const moments = [now];
  for (let i = 1; i <= MIDNIGHTS_AHEAD; i++) {
    moments.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
  }
  const timeline = moments.map((date) => ({ date, snapshot: snapshotAt(date, entries, palette, hasPlus) }));

  TodayCloverWidget.updateTimeline(timeline.map(({ date, snapshot }) => ({ date, props: snapshot.today })));
  CloverStreakWidget.updateTimeline(timeline.map(({ date, snapshot }) => ({ date, props: snapshot.streak })));
  CloverLockScreenWidget.updateTimeline(timeline.map(({ date, snapshot }) => ({ date, props: snapshot.streak })));
  CloverWeekStripWidget.updateTimeline(timeline.map(({ date, snapshot }) => ({ date, props: snapshot.week })));
  CloverMiniCalendarWidget.updateTimeline(timeline.map(({ date, snapshot }) => ({ date, props: snapshot.calendar })));
}
