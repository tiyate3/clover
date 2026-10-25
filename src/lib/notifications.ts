import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { fromKey, toKey } from './dates';
import type { Entries } from './store';

const supported = Platform.OS !== 'web';

export const REMINDER_MESSAGES = [
  'What went right today?',
  'Any little wins today?',
  'Did anything go your way today?',
  'What made you smile today?',
  'One good thing, big or small?',
  "What's one thing you're grateful for today?",
  'Spotted any luck today?',
  'Before bed, what was good about today?',
  'Tiny moments count too, what was yours?',
  'Keep your streak growing!',
  'What are you glad happened today?',
  'Anything lucky happen today?',
  'Who or what made today a bit better?',
  'Take a second to save a good moment',
];

/** How many days of reminders to keep scheduled (iOS allows 64 pending). Topped up on every app open. */
const DAYS_AHEAD = 30;
const DECK_KEY = 'clover:reminderDeck:v1';

/**
 * The message for each day comes from a saved sequence of shuffled decks: day N after `anchor` uses
 * `order[N]`. Every message appears once per deck before reshuffling, and rescheduling never skips one.
 */
type Deck = { anchor: string; order: number[] };

export function configureNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if needed. Returns true when reminders can be delivered. */
export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return next.granted;
}

/** Checks existing permission without presenting the system permission dialog. */
export async function notificationsAllowed(): Promise<boolean> {
  if (!supported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

const daysBetween = (a: string, b: string) => Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);

function shuffledDeck(avoidFirst?: number): number[] {
  const deck = REMINDER_MESSAGES.map((_, i) => i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  // Don't show the same message two days running across a reshuffle.
  if (avoidFirst !== undefined && deck[0] === avoidFirst) [deck[0], deck[1]] = [deck[1], deck[0]];
  return deck;
}

/** Message for each of the given (ascending) day keys, extending and saving the sequence as needed. */
async function messagesFor(days: string[]): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DECK_KEY);
  let deck: Deck = raw ? JSON.parse(raw) : { anchor: days[0], order: [] };
  const size = REMINDER_MESSAGES.length;

  // Drop whole decks that are entirely in the past.
  const pastDecks = Math.floor(Math.max(0, daysBetween(deck.anchor, days[0])) / size);
  if (pastDecks > 0) {
    const anchor = fromKey(deck.anchor);
    anchor.setDate(anchor.getDate() + pastDecks * size);
    deck = { anchor: toKey(anchor), order: deck.order.slice(pastDecks * size) };
  }

  const lastIndex = daysBetween(deck.anchor, days[days.length - 1]);
  while (deck.order.length <= lastIndex) deck.order.push(...shuffledDeck(deck.order[deck.order.length - 1]));
  await AsyncStorage.setItem(DECK_KEY, JSON.stringify(deck));

  return days.map((d) => REMINDER_MESSAGES[deck.order[Math.max(0, daysBetween(deck.anchor, d))]]);
}

type ReminderPlan = {
  enabled: boolean;
  hour: number;
  minute: number;
  yesterdayReminderEnabled: boolean;
  entries: Entries;
  /** Day key the app was first opened. There's no "yesterday" to catch up on before it. */
  startedOn: string;
};

let queue: Promise<void> = Promise.resolve();

/**
 * Replaces scheduled reminders for the next DAYS_AHEAD days. Daily reminders skip logged days;
 * the 8 PM catch-up reminder checks the previous day and deliberately ignores today's entry. It never
 * asks about a day before the app was installed, so nobody is nudged on the day they download it.
 * Calls are serialised.
 */
export function syncReminders(plan: ReminderPlan): Promise<void> {
  queue = queue.then(() => doSync(plan)).catch((e) => console.warn('Clover: reminder scheduling failed', e));
  return queue;
}

async function doSync({ enabled, hour, minute, yesterdayReminderEnabled, entries, startedOn }: ReminderPlan) {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled && !yesterdayReminderEnabled) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const now = new Date();
  const daily: Date[] = [];
  const missedYesterday: Date[] = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (enabled) {
      const dailyAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);
      if (dailyAt > now && !entries[toKey(today)]?.length) daily.push(dailyAt);
    }
    if (yesterdayReminderEnabled) {
      const previousDay = new Date(today);
      previousDay.setDate(previousDay.getDate() - 1);
      const reminderAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0);
      const previousKey = toKey(previousDay);
      if (reminderAt > now && previousKey >= startedOn && !entries[previousKey]?.length) missedYesterday.push(reminderAt);
    }
  }

  const bodies = daily.length ? await messagesFor(daily.map(toKey)) : [];
  for (let i = 0; i < daily.length; i++) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Clover', body: bodies[i] },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: daily[i] },
    });
  }
  for (const date of missedYesterday) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A little reminder',
        body: 'You haven’t logged yesterday’s good thing yet. There’s still time to keep your streak going.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}
