import { toKey } from './dates';
import type { Entries, Item } from './store';

/**
 * A believable few months of Clover, for screen recordings and social content. It is generated
 * from a fixed seed, so every recording shows the same calendar. Today is left empty so adding
 * a moment can be filmed live, and the last few weeks are unbroken so there's a streak to show.
 */

const MOMENTS = [
  'Coffee was perfect this morning',
  'Caught the train with seconds to spare',
  'Found a fiver in my old coat',
  'Sunset walk by the river',
  'My sister called just to chat',
  'Nailed the presentation',
  'First swim of the year',
  'Fresh bread from the bakery',
  'The dog learned a new trick',
  'Finished my book on the bus',
  'A stranger complimented my jacket',
  'Got the last table at brunch',
  'Rain stopped right as I left',
  'Long lunch in the sun',
  'Tried a new recipe and it worked',
  'Green lights all the way home',
  'Early night, slept so well',
  'Laughed until I cried with friends',
  'New plant has a flower',
  'Booked the summer trip',
  'Ran my fastest 5k',
  'Mum sent the old photos',
  'Quiet morning with tea',
  'Fixed the wobbly shelf myself',
  'Free upgrade at the cinema',
  'Bumped into an old friend',
  'Perfect playlist on shuffle',
  'Made it to yoga',
  'The farmers market had peaches',
  'Got good news from work',
  'Picnic in the park',
  'Beat my brother at chess',
  'Saw a double rainbow',
  'Cleared my whole inbox',
  'Found the perfect birthday gift',
  'Warm socks straight from the dryer',
  'Ice cream after the gym, no regrets',
  'The cat finally sat on my lap',
  'Watered the garden at golden hour',
  'Wrote three pages in my journal',
  'Ordered the right thing for once',
  'Neighbour dropped round cookies',
  'Got a seat on the busy train',
  'Video call with the whole family',
  'Booked my first pottery class',
  'Clear skies, saw the stars',
  'Pay day!',
  'Finally hung the pictures up',
  'Walked instead of driving',
  'Someone held the door and smiled',
];

/** Lucky days: the bigger moments. */
const LUCKY = [
  'Got the job!',
  'Won the raffle at work',
  'Concert tickets at face value',
  'Found my lost ring',
  'Surprise visit from my best friend',
  'Passed my driving test',
  'Flight upgraded to business',
  'Engaged!',
];

/** Small seeded random generator (mulberry32), so the demo looks the same every time. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_DAYS = 120;
/** The most recent days are all logged, so the demo has a streak to show off. */
const STREAK_DAYS = 23;

/** Builds the demo entries, and the first day of the demo calendar. */
export function buildDemoEntries(today: Date = new Date()): { entries: Entries; startedOn: string } {
  const random = seeded(7);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
  const entries: Entries = {};
  let start = toKey(today);

  for (let back = DEMO_DAYS; back >= 1; back--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const key = toKey(day);
    if (back === DEMO_DAYS) start = key;
    const inStreak = back <= STREAK_DAYS;
    if (!inStreak && random() < 0.18) continue; // The odd missed day, like real life.

    const roll = random();
    const count = roll < 0.6 ? 1 : roll < 0.9 ? 2 : 3;
    const lucky = random() < 0.1;
    const used = new Set<string>();
    const items: Item[] = [];
    for (let i = 0; i < count; i++) {
      const golden = lucky && i === 0;
      let text = golden ? pick(LUCKY) : pick(MOMENTS);
      while (used.has(text)) text = pick(MOMENTS);
      used.add(text);
      // Saved that evening, so every day counts towards its streak.
      const savedAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 19 + i, Math.floor(random() * 60)).getTime();
      items.push({ id: `demo-${key}-${i}`, text, extraLucky: golden, savedAt });
    }
    entries[key] = items;
  }

  return { entries, startedOn: start };
}
