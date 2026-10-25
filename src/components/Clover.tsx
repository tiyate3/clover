import { Image } from 'react-native';
import { Palette, useTheme } from '@/lib/theme';

export type CloverVariant = 'outline' | 'faint' | 'filled' | 'lucky';

// Below this size the outline's fine line would all but vanish, so a heavier copy of the same
// drawing is used instead.
const BOLD_OUTLINE_BELOW = 80;

// The outline comes ready-coloured for light and dark themes. Don't tint these images with
// `tintColor`: iOS reuses image views, and a tint can stick to the next image drawn in that view
// (a day turning from empty to filled, or a gold clover), leaving it a flat, faint shape.
const OUTLINES = {
  light: {
    fine: require('../../assets/clover-outline.png'),
    bold: require('../../assets/clover-outline-bold.png'),
  },
  dark: {
    fine: require('../../assets/clover-outline-dark.png'),
    bold: require('../../assets/clover-outline-bold-dark.png'),
  },
};

type Props = {
  size?: number;
  variant?: CloverVariant;
  /** Draw with a specific palette instead of the active theme (used for theme previews). */
  palette?: Palette;
};

/**
 * `outline` is an empty day still to come (Today before anything's logged); `faint` is a day that
 * passed empty, so it sits back a little further.
 */
export function Clover({ size = 48, variant = 'filled', palette }: Props) {
  const active = useTheme();
  const c = palette ?? active;

  if (variant === 'lucky') return <GoldClover size={size} palette={palette} />;

  if (variant === 'filled') {
    return (
      <Image
        // Keyed by variant, so a day turning from empty to filled gets a fresh image view.
        key="filled"
        source={require('../../assets/clover-filled.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessible={false}
      />
    );
  }

  const outline = OUTLINES[c.dark ? 'dark' : 'light'];
  return (
    <Image
      key="outline"
      source={size < BOLD_OUTLINE_BELOW ? outline.bold : outline.fine}
      style={{ width: size, height: size, opacity: variant === 'faint' ? 0.32 : 0.45 }}
      resizeMode="contain"
      accessible={false}
    />
  );
}

/** The shared metallic gold clover artwork used throughout the app. */
export function GoldClover({ size = 48 }: Pick<Props, 'size' | 'palette'>) {
  return (
    <Image
      source={require('../../assets/gold-clover.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
