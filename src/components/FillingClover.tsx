import { useEffect } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, EASE, fadeTiming } from '@/lib/motion';
import { useTheme } from '@/lib/theme';
import { Clover } from './Clover';

/** Turning gold is a moment, so it takes a little longer than the fill. */
const GOLD_DURATION = 900;

// Soft halos made from each clover's own shape, pre-blurred onto a canvas 1.25x the clover. The
// colour is in the image (no tintColor, which iOS can leave stuck on reused image views). Dark
// themes use a black shadow, so it's always darker than the background, never a light glow.
const HALOS = {
  light: { green: require('../../assets/clover-shadow.png'), gold: require('../../assets/gold-clover-shadow.png') },
  dark: { green: require('../../assets/clover-shadow-dark.png'), gold: require('../../assets/gold-clover-shadow-dark.png') },
};

type Props = {
  size: number;
  filled: boolean;
  lucky: boolean;
  /** Settle to a smaller size once filled (Today's big clover does this). */
  shrinkTo?: number;
  /** A soft shadow around the filled clover. */
  halo?: boolean;
};

/**
 * A clover that eases from outline to filled once the day has something in it, and from green
 * to the gold four-leaf when the day turns extra lucky. It waits for the keyboard to leave, so
 * the moment happens where you can see it.
 */
export function FillingClover({ size, filled, lucky, shrinkTo = 1, halo = false }: Props) {
  const c = useTheme();
  const halos = HALOS[c.dark ? 'dark' : 'light'];
  const reduceMotion = useReducedMotion();
  const keyboardOpen = useKeyboardState((s) => s.isVisible);
  const isGold = filled && lucky;
  const fill = useSharedValue(filled ? 1 : 0);
  const gold = useSharedValue(isGold ? 1 : 0);

  useEffect(() => {
    if (keyboardOpen) return;
    fill.set(withTiming(filled ? 1 : 0, fadeTiming(duration.fill)));
    gold.set(withTiming(isGold ? 1 : 0, { duration: GOLD_DURATION, easing: EASE, reduceMotion: ReduceMotion.Never }));
  }, [filled, isGold, keyboardOpen, fill, gold]);

  const wrapStyle = useAnimatedStyle(() => ({
    // Under Reduce Motion the clover cross-fades but doesn't visibly shrink.
    transform: [{ scale: reduceMotion ? (fill.value > 0.5 ? shrinkTo : 1) : 1 - fill.value * (1 - shrinkTo) }],
  }));
  const outlineStyle = useAnimatedStyle(() => ({ opacity: 1 - fill.value }));
  // The green clover lifts away very slightly as the gold one blooms in beneath it.
  const greenStyle = useAnimatedStyle(() => ({
    opacity: fill.value * (1 - gold.value),
    transform: reduceMotion ? [] : [{ scale: interpolate(gold.value, [0, 1], [1, 1.04]) }],
  }));
  const goldStyle = useAnimatedStyle(() => ({
    opacity: fill.value * gold.value,
    transform: reduceMotion
      ? []
      : [
          { scale: interpolate(gold.value, [0, 1], [0.9, 1]) },
          { rotate: `${interpolate(gold.value, [0, 1], [-10, 0])}deg` },
        ],
  }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, wrapStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, outlineStyle]}>
        <Clover size={size} variant="outline" />
      </Animated.View>
      {/* Each halo sits inside its clover's layer, so it fades, grows and turns with it. */}
      <Animated.View style={[StyleSheet.absoluteFill, greenStyle]}>
        {halo && <Halo source={halos.green} size={size} opacity={c.dark ? 0.6 : 0.4} />}
        <Clover size={size} variant="filled" />
      </Animated.View>
      <Animated.View style={goldStyle}>
        {halo && <Halo source={halos.gold} size={size} opacity={c.dark ? 0.6 : 0.42} />}
        <Clover size={size} variant="lucky" />
      </Animated.View>
    </Animated.View>
  );
}

/** Sits a touch low, like a shadow cast from above. */
function Halo({ source, size, opacity }: { source: ImageSourcePropType; size: number; opacity: number }) {
  return (
    <Image
      source={source}
      style={{
        position: 'absolute',
        width: size * 1.25,
        height: size * 1.25,
        left: -size * 0.125,
        top: -size * 0.125 + size * 0.035,
        opacity,
      }}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center' },
});
