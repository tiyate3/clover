import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

// The same image, size and colour as the native splash (the splash plugin's `imageWidth` of 140
// and `backgroundColor` in app.json), so the hand-off from it is invisible. Always white, in
// light and dark mode alike.
const SPLASH_BACKGROUND = '#FFFFFF';
const SPLASH_SIZE = 140;
const EASE = Easing.bezier(0.4, 0, 0.2, 1);

/** The splash frame, drawn in React so it can take over from the native splash. */
export function SplashMark() {
  return (
    <Image
      source={require('../../assets/clover-filled.png')}
      style={{ width: SPLASH_SIZE, height: SPLASH_SIZE }}
      resizeMode="contain"
      accessible={false}
    />
  );
}

type Props = { reduceMotion: boolean; onFinish: () => void };

/** Picks up from the native splash: a very gentle shake of the clover, then a fade into the app. */
export function OpeningAnimation({ reduceMotion, onFinish }: Props) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [shake] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const tilt = (toValue: number, duration: number) =>
      Animated.timing(shake, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const fadeOut = (delay: number) =>
      Animated.timing(opacity, { toValue: 0, duration: 500, delay, easing: EASE, useNativeDriver: true });

    // Each swing is smaller than the last, so it settles instead of stopping dead.
    const animation = reduceMotion
      ? fadeOut(150)
      : Animated.sequence([
          Animated.delay(150),
          tilt(-1, 260),
          tilt(0.6, 300),
          tilt(-0.25, 280),
          tilt(0, 240),
          fadeOut(80),
        ]);
    animation.start(({ finished }) => finished && onFinish());
    return () => animation.stop();
  }, [onFinish, opacity, reduceMotion, shake]);

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] });

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <SplashMark />
      </Animated.View>
    </Animated.View>
  );
}

/** Shown while data loads, in case the native splash hides first. Identical to the splash. */
export function SplashScreenFrame() {
  return (
    <View style={styles.overlay}>
      <SplashMark />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    // Above onboarding (2000), so a first launch shows the shake, then fades into onboarding.
    zIndex: 3000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_BACKGROUND,
  },
});
