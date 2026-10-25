import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayKey } from './dates';

/**
 * Today's day key, kept current. Screens stay mounted and iOS resumes the app without
 * re-rendering, so a plain `todayKey()` in render goes stale overnight (and an entry added the
 * next morning would land on yesterday). This updates just after midnight and whenever the app
 * comes back to the foreground, which also covers time zone changes.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const refresh = () => setToday(todayKey());
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnight();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
