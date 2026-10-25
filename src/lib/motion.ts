import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  LinearTransition,
  ReduceMotion,
  useReducedMotion,
} from 'react-native-reanimated';

/** One soft ease-in-out curve for every movement, so nothing snaps. */
export const EASE = Easing.bezier(0.4, 0, 0.2, 1);

export const duration = { quick: 160, base: 240, settle: 380, fill: 550 };

/**
 * Timing for fades. Fades stay on with Reduce Motion (they don't move anything),
 * so they opt out of Reanimated's system check.
 */
export const fadeTiming = (ms: number = duration.base) => ({ duration: ms, easing: EASE, reduceMotion: ReduceMotion.Never });

/** Layout animations for list rows and forms, swapped for plain fades under Reduce Motion. */
export function useEntryMotion() {
  const reduceMotion = useReducedMotion();
  return {
    reduceMotion,
    /** A saved entry fades in while sliding up a few points into place. */
    settle: reduceMotion
      ? FadeIn.duration(duration.base).reduceMotion(ReduceMotion.Never)
      : new Keyframe({
          0: { opacity: 0, transform: [{ translateY: 8 }] },
          100: { opacity: 1, transform: [{ translateY: 0 }], easing: EASE },
        })
          .duration(duration.settle)
          .reduceMotion(ReduceMotion.Never),
    fadeIn: FadeIn.duration(duration.base).easing(EASE).reduceMotion(ReduceMotion.Never),
    fadeOut: FadeOut.duration(duration.quick).easing(EASE).reduceMotion(ReduceMotion.Never),
    /** Neighbours glide to their new spot; under Reduce Motion they simply move. */
    layout: reduceMotion ? undefined : LinearTransition.duration(duration.base).easing(EASE),
  };
}

/** A light tap, ignored where haptics aren't available. */
export function lightHaptic() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
