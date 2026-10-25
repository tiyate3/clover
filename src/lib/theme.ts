import { useMemo } from 'react';
import { ImageStyle, StyleSheet, TextStyle, useColorScheme, ViewStyle } from 'react-native';
import { useStore } from './store';
import { Palette, resolvePalette } from './themes';

export type { Palette } from './themes';

// iPhone system font (SF Pro): no fontFamily means the platform default.
export const fontWeights = {
  regular: '400',
  semibold: '500',
  bold: '600',
  extrabold: '700',
} as const;

export const radius = { sm: 12, md: 16, lg: 22, pill: 8 };
export const space = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 };

/** Restrained depth for raised surfaces, tuned for both light and dark palettes. */
export function softShadow(c: Palette) {
  return {
    shadowColor: c.dark ? '#000000' : '#49614D',
    shadowOpacity: c.dark ? 0.16 : 0.045,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  } as const;
}

/** A soft shadow under page titles; deeper in dark themes so it still reads on the grey. */
export function titleShadow(c: Palette) {
  return {
    // A wide, soft spread that stays right under the letters (barely offset).
    textShadowColor: c.dark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.16)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: c.dark ? 16 : 14,
  } as const;
}

/** The active colour palette, from the chosen theme and light/dark setting. */
export function useTheme(): Palette {
  const { settings, hasPlus } = useStore();
  const system = useColorScheme();
  const dark = settings.appearance === 'system' ? system === 'dark' : settings.appearance === 'dark';
  return useMemo(() => resolvePalette(settings.theme, dark, hasPlus), [settings.theme, dark, hasPlus]);
}

/** A map of named styles, as `StyleSheet.create` takes. */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** Builds a StyleSheet from the active palette, rebuilt only when the palette changes. */
export function useStyles<T extends NamedStyles<T>>(factory: (c: Palette) => T & NamedStyles<any>): T {
  const c = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(c)), [c]);
}
