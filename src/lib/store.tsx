import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fromKey, todayKey, toKey } from './dates';
import { buildDemoEntries } from './demoData';
import type { ThemeId } from './themes';

/** One good or lucky thing. A day can have several. */
export type Item = {
  id: string;
  text: string;
  extraLucky: boolean;
  savedAt: number;
};

/** Day key (YYYY-MM-DD) → that day's items, oldest first. Days with no items are absent. */
export type Entries = Record<string, Item[]>;

export type Appearance = 'system' | 'light' | 'dark';

export type Settings = {
  reminderEnabled: boolean;
  yesterdayReminderEnabled: boolean;
  hour: number;
  minute: number;
  /** Light/dark for the Classic theme (free). */
  appearance: Appearance;
  /** Colour theme; all but Classic need Clover+. */
  theme: ThemeId;
  /** Ask for Face ID when opening the app (Clover+). */
  faceIdLock: boolean;
};

const ENTRIES_KEY = 'clover:entries:v2';
const LEGACY_ENTRIES_KEY = 'clover:entries:v1'; // one entry per day: { text, extraLucky, savedAt }
const SETTINGS_KEY = 'clover:settings:v1';
const STARTED_KEY = 'clover:startedOn:v1';
const PLUS_KEY = 'clover:plus:v1';
/** Demo data for recordings lives apart from the real entries, which it never touches. */
const DEMO_KEY = 'clover:demo:v1';
/** Set once the old "follow the device" default has been moved to light, so it happens only once. */
const LIGHT_DEFAULT_KEY = 'clover:lightDefault:v1';
const DEMO_ENTRIES_KEY = 'clover:demoEntries:v1';
const DEMO_STARTED_KEY = 'clover:demoStartedOn:v1';

const defaultSettings: Settings = {
  reminderEnabled: false,
  yesterdayReminderEnabled: true,
  hour: 20,
  minute: 0,
  appearance: 'light',
  theme: 'classic',
  faceIdLock: false,
};

export const isLuckyDay = (items: Item[] | undefined) => !!items?.some((i) => i.extraLucky);

/**
 * Streak rule: a day counts toward a streak only if something was logged on that day or the day after.
 * Filling in older days still gives them a clover, but doesn't rebuild an old streak.
 */
export function countsForStreak(day: string, items: Item[] | undefined): boolean {
  if (!items?.length) return false;
  const next = fromKey(day);
  next.setDate(next.getDate() + 1);
  const latest = toKey(next);
  return items.some((i) => toKey(new Date(i.savedAt)) <= latest);
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type Store = {
  ready: boolean;
  resetVersion: number;
  entries: Entries;
  settings: Settings;
  /** Day key of the first time the app was opened; the calendar starts here. */
  startedOn: string;
  /** Clover+ (the one-time unlock) has been bought. */
  hasPlus: boolean;
  /** Showing generated demo data (for screen recordings) instead of the real entries. */
  demoMode: boolean;
  addItem: (day: string, text: string, extraLucky: boolean) => Promise<number>;
  updateItem: (day: string, id: string, text: string, extraLucky: boolean) => Promise<void>;
  removeItem: (day: string, id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  setHasPlus: (value: boolean) => Promise<void>;
  /** Clears entries and settings. `keepPlus` leaves a bought Clover+ unlocked. */
  resetAppData: (options?: { keepPlus?: boolean }) => Promise<void>;
  /** Swaps in fresh demo data, or puts the real entries back exactly as they were. */
  setDemoMode: (on: boolean) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

async function loadEntries(): Promise<Entries> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  if (raw) return JSON.parse(raw);

  // Migrate data saved before days could hold several items.
  const legacy = await AsyncStorage.getItem(LEGACY_ENTRIES_KEY);
  if (!legacy) return {};
  const old: Record<string, { text: string; extraLucky: boolean; savedAt: number }> = JSON.parse(legacy);
  const migrated: Entries = {};
  for (const [day, e] of Object.entries(old)) {
    migrated[day] = [{ id: newId(), text: e.text, extraLucky: e.extraLucky, savedAt: e.savedAt }];
  }
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(migrated));
  await AsyncStorage.removeItem(LEGACY_ENTRIES_KEY);
  return migrated;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [resetVersion, setResetVersion] = useState(0);
  const [entries, setEntries] = useState<Entries>({});
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [startedOn, setStartedOn] = useState(todayKey());
  const [hasPlus, setHasPlusState] = useState(false);
  const [demoMode, setDemoModeState] = useState(false);
  // Mirrors of the latest state, so writes never persist a stale snapshot.
  const entriesRef = useRef(entries);
  const settingsRef = useRef(settings);
  /** Where entry writes go: the demo set while demo mode is on, otherwise the real one. */
  const entriesKeyRef = useRef(ENTRIES_KEY);

  useEffect(() => {
    (async () => {
      try {
        const [loaded, rawSettings, rawStarted, rawPlus, rawDemo, lightDefaultDone] = await Promise.all([
          loadEntries(),
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(STARTED_KEY),
          AsyncStorage.getItem(PLUS_KEY),
          AsyncStorage.getItem(DEMO_KEY),
          AsyncStorage.getItem(LIGHT_DEFAULT_KEY),
        ]);
        entriesRef.current = loaded;
        setEntries(loaded);
        if (rawSettings) {
          const savedSettings = JSON.parse(rawSettings) as Partial<Settings>;
          // The previous default followed the device. Move that to light once; after that,
          // Automatic is a choice people make in Settings and is kept.
          const moveToLight = !lightDefaultDone && (savedSettings.appearance ?? 'system') === 'system';
          settingsRef.current = {
            ...defaultSettings,
            ...savedSettings,
            ...(moveToLight ? { appearance: 'light' as const } : {}),
          };
          setSettings(settingsRef.current);
          if (moveToLight) await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsRef.current));
        }
        if (!lightDefaultDone) await AsyncStorage.setItem(LIGHT_DEFAULT_KEY, 'true');
        setHasPlusState(rawPlus === 'true');
        // First launch: remember today. If older data exists, start from its earliest day.
        let started = rawStarted;
        if (!started) {
          started = [todayKey(), ...Object.keys(loaded)].sort()[0];
          await AsyncStorage.setItem(STARTED_KEY, started);
        }
        setStartedOn(started);

        // Demo mode survives a relaunch, so a recording can be restarted mid-take.
        // Development builds only: a production build installed over a dev build must show real data.
        if (__DEV__ && rawDemo === 'true') {
          const [demoRaw, demoStarted] = await Promise.all([
            AsyncStorage.getItem(DEMO_ENTRIES_KEY),
            AsyncStorage.getItem(DEMO_STARTED_KEY),
          ]);
          if (demoRaw && demoStarted) {
            const demo: Entries = JSON.parse(demoRaw);
            entriesKeyRef.current = DEMO_ENTRIES_KEY;
            entriesRef.current = demo;
            setEntries(demo);
            setStartedOn(demoStarted);
            setDemoModeState(true);
          }
        }
      } catch (e) {
        console.warn('Clover: failed to load saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const writeEntries = useCallback(async (next: Entries) => {
    entriesRef.current = next;
    setEntries(next);
    await AsyncStorage.setItem(entriesKeyRef.current, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    async (day: string, text: string, extraLucky: boolean) => {
      if (day > todayKey()) return 0; // Future days can never be logged.
      const item: Item = { id: newId(), text: text.trim(), extraLucky, savedAt: Date.now() };
      const cur = entriesRef.current;
      const next = { ...cur, [day]: [...(cur[day] ?? []), item] };
      await writeEntries(next);
      // Demo days don't count, so recordings never trigger the review prompt.
      if (entriesKeyRef.current === DEMO_ENTRIES_KEY) return 0;
      return Object.entries(next).filter(([key, items]) => key <= todayKey() && items.length > 0).length;
    },
    [writeEntries],
  );

  const updateItem = useCallback(
    async (day: string, id: string, text: string, extraLucky: boolean) => {
      if (day > todayKey()) return;
      const yesterday = fromKey(todayKey());
      yesterday.setDate(yesterday.getDate() - 1);
      const backfillingYesterday = day === toKey(yesterday);
      const cur = entriesRef.current;
      const items = (cur[day] ?? []).map((i) =>
        i.id === id
          ? { ...i, text: text.trim(), extraLucky, ...(backfillingYesterday ? { savedAt: Date.now() } : {}) }
          : i,
      );
      await writeEntries({ ...cur, [day]: items });
    },
    [writeEntries],
  );

  const removeItem = useCallback(
    async (day: string, id: string) => {
      if (day > todayKey()) return;
      const next = { ...entriesRef.current };
      const items = (next[day] ?? []).filter((i) => i.id !== id);
      if (items.length) next[day] = items;
      else delete next[day];
      await writeEntries(next);
    },
    [writeEntries],
  );

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const setHasPlus = useCallback(async (value: boolean) => {
    setHasPlusState(value);
    await AsyncStorage.setItem(PLUS_KEY, String(value));
  }, []);

  const resetAppData = useCallback(async ({ keepPlus = false }: { keepPlus?: boolean } = {}) => {
    await AsyncStorage.multiRemove([
      ENTRIES_KEY,
      LEGACY_ENTRIES_KEY,
      SETTINGS_KEY,
      STARTED_KEY,
      ...(keepPlus ? [] : [PLUS_KEY]),
      DEMO_KEY,
      DEMO_ENTRIES_KEY,
      DEMO_STARTED_KEY,
    ]);
    entriesKeyRef.current = ENTRIES_KEY;
    setDemoModeState(false);
    const started = todayKey();
    entriesRef.current = {};
    settingsRef.current = defaultSettings;
    setEntries({});
    setSettings(defaultSettings);
    setStartedOn(started);
    if (!keepPlus) setHasPlusState(false);
    setResetVersion((version) => version + 1);
  }, []);

  const setDemoMode = useCallback(async (on: boolean) => {
    if (on) {
      const demo = buildDemoEntries();
      await AsyncStorage.multiSet([
        [DEMO_ENTRIES_KEY, JSON.stringify(demo.entries)],
        [DEMO_STARTED_KEY, demo.startedOn],
        [DEMO_KEY, 'true'],
      ]);
      entriesKeyRef.current = DEMO_ENTRIES_KEY;
      entriesRef.current = demo.entries;
      setEntries(demo.entries);
      setStartedOn(demo.startedOn);
      setDemoModeState(true);
      return;
    }
    // Back to the real entries, read fresh from storage, exactly as they were left.
    const [real, realStarted] = await Promise.all([loadEntries(), AsyncStorage.getItem(STARTED_KEY)]);
    await AsyncStorage.multiRemove([DEMO_KEY, DEMO_ENTRIES_KEY, DEMO_STARTED_KEY]);
    entriesKeyRef.current = ENTRIES_KEY;
    entriesRef.current = real;
    setEntries(real);
    setStartedOn(realStarted ?? todayKey());
    setDemoModeState(false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      resetVersion,
      entries,
      settings,
      startedOn,
      hasPlus,
      demoMode,
      addItem,
      updateItem,
      removeItem,
      updateSettings,
      setHasPlus,
      resetAppData,
      setDemoMode,
    }),
    [
      ready,
      resetVersion,
      entries,
      settings,
      startedOn,
      hasPlus,
      demoMode,
      addItem,
      updateItem,
      removeItem,
      updateSettings,
      setHasPlus,
      resetAppData,
      setDemoMode,
    ],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
