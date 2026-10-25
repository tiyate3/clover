/** Every colour the UI uses. Each theme fills in all of them. */
export type Palette = {
  /** Dark backgrounds get light status-bar text. */
  dark: boolean;
  background: string;
  /** Cards, inputs and list rows. */
  surface: string;
  /** Popups and the tab bar. */
  sheet: string;
  line: string;
  text: string;
  muted: string;
  faint: string;
  /** Main buttons, active tab, switches. */
  primary: string;
  onPrimary: string;
  /** Soft pill buttons and highlights. */
  soft: string;
  cloverFill: string;
  cloverStroke: string;
  /** Extra-lucky clovers. */
  gold: string;
  goldStroke: string;
  goldSoft: string;
};

export type ThemeId = 'classic' | 'golden' | 'forest' | 'midnight' | 'blossom' | 'autumn';

export type ThemeInfo = {
  id: ThemeId;
  name: string;
  description: string;
  paid: boolean;
};

export const THEMES: ThemeInfo[] = [
  { id: 'classic', name: 'Classic', description: 'Soft white and sage', paid: false },
  { id: 'forest', name: 'Forest', description: 'Deep, dark and moody', paid: true },
  { id: 'golden', name: 'Golden hour', description: 'Warm honey gold', paid: true },
  { id: 'blossom', name: 'Blossom', description: 'Soft pink and sage', paid: true },
  { id: 'midnight', name: 'Midnight', description: 'Deep navy and silver', paid: true },
  { id: 'autumn', name: 'Autumn', description: 'Rust and mustard', paid: true },
];

const classicLight: Palette = {
  dark: false,
  background: '#FCFCFC',
  surface: '#F9FAF9',
  sheet: '#FFFFFF',
  line: '#EBEEEA',
  text: '#2F5D3A',
  muted: '#8C9A8E',
  faint: '#CBD5C9',
  primary: '#2F5D3A',
  onPrimary: '#FFFFFF',
  soft: '#E9F0E7',
  cloverFill: '#7FA37A',
  cloverStroke: '#2F5D3A',
  gold: '#D4A84B',
  goldStroke: '#B48A33',
  goldSoft: '#F7EEDA',
};

// Neutral dark greys (not black), like iOS dark mode; green stays for the clovers and accents
// (the green-tinted dark look is the Forest theme's).
const classicDark: Palette = {
  dark: true,
  background: '#1E1E20',
  surface: '#2A2A2D',
  sheet: '#2E2E31',
  line: '#505055',
  text: '#F2F2F4',
  muted: '#98989F',
  faint: '#4A4A4E',
  primary: '#2F5D3A',
  onPrimary: '#FFFFFF',
  soft: '#38383C',
  cloverFill: '#7FA37A',
  cloverStroke: '#B9D1B2',
  gold: '#D4A84B',
  goldStroke: '#E8C574',
  goldSoft: '#2E2A20',
};

const PALETTES: Record<Exclude<ThemeId, 'classic'>, Palette> = {
  golden: {
    dark: false,
    background: '#FCFCFC',
    surface: '#F9FAF9',
    sheet: '#FFFFFF',
    line: '#E7EAE6',
    text: '#4A3F2A',
    muted: '#9A8B6C',
    faint: '#DCCFB1',
    primary: '#C9A04A',
    onPrimary: '#FFFFFF',
    soft: '#F1E4C6',
    cloverFill: '#A9B98A',
    cloverStroke: '#5E6A40',
    gold: '#C9A04A',
    goldStroke: '#8F6E28',
    goldSoft: '#F1E4C6',
  },
  forest: {
    dark: true,
    background: '#1F2E24',
    surface: '#27392D',
    sheet: '#2B3F31',
    line: '#36493B',
    text: '#EEF2EA',
    muted: '#A7B7A8',
    faint: '#4C6251',
    primary: '#A8C3A0',
    onPrimary: '#1F2E24',
    soft: '#31473A',
    cloverFill: '#A8C3A0',
    cloverStroke: '#DCE8D7',
    gold: '#D4A84B',
    goldStroke: '#EDCB7A',
    goldSoft: '#3D3B26',
  },
  midnight: {
    dark: true,
    background: '#141B2B',
    surface: '#1B2438',
    sheet: '#1F2A40',
    line: '#2A3550',
    text: '#E8ECF5',
    muted: '#9AA4BA',
    faint: '#3A4560',
    primary: '#B8C6E3',
    onPrimary: '#141B2B',
    soft: '#243049',
    cloverFill: '#8FB38A',
    cloverStroke: '#CFE0CB',
    gold: '#D9B25A',
    goldStroke: '#EBCB7E',
    goldSoft: '#3A3424',
  },
  blossom: {
    dark: false,
    background: '#FCFCFC',
    surface: '#F9FAF9',
    sheet: '#FFFFFF',
    line: '#E7EAE6',
    text: '#4A3A3C',
    muted: '#A08A8C',
    faint: '#E2C9CB',
    primary: '#D9A5A8',
    onPrimary: '#4A3A3C',
    soft: '#F3DDDE',
    cloverFill: '#9DB59A',
    cloverStroke: '#5F7A5C',
    gold: '#D4A84B',
    goldStroke: '#B48A33',
    goldSoft: '#F6E8D2',
  },
  autumn: {
    dark: false,
    background: '#FCFCFC',
    surface: '#F9FAF9',
    sheet: '#FFFFFF',
    line: '#E7EAE6',
    text: '#4A3428',
    muted: '#9A8473',
    faint: '#D8C7B2',
    primary: '#B86B45',
    onPrimary: '#FFFFFF',
    soft: '#EEDCCB',
    cloverFill: '#CFA040',
    cloverStroke: '#7A5126',
    gold: '#B86B45',
    goldStroke: '#7E4126',
    goldSoft: '#F0D9CA',
  },
};

/**
 * The palette to show. Classic follows light/dark mode; the paid themes have fixed colours.
 * A paid theme without Clover+ falls back to Classic.
 */
export function resolvePalette(theme: ThemeId, dark: boolean, hasPlus: boolean): Palette {
  // A theme that no longer exists (e.g. one saved before it was replaced) shows as Classic.
  if (theme !== 'classic' && hasPlus && PALETTES[theme]) return PALETTES[theme];
  return dark ? classicDark : classicLight;
}

/** Palette used for the theme preview swatches (always the light Classic for "Classic"). */
export function previewPalette(theme: ThemeId): Palette {
  return (theme !== 'classic' && PALETTES[theme]) || classicLight;
}
