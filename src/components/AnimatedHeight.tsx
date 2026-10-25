import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { duration, EASE } from '@/lib/motion';

/** Invisible bleed so the clip never cuts off the input's soft focus shadow or lift. */
const BLEED = 14;

/**
 * Eases its own height to fit its children, so a container sized by its content
 * (like the Clovers day sheet) grows and shrinks smoothly instead of jumping.
 * Under Reduce Motion the size changes at once.
 */
export function AnimatedHeight({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const height = useSharedValue(-1);
  const [measured, setMeasured] = useState(false);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    if (!measured || reduceMotion) {
      height.set(next);
      setMeasured(true);
      return;
    }
    height.set(withTiming(next, { duration: duration.base, easing: EASE }));
  };

  // Until the first measurement the children lay out normally, so the first frame is already the right size.
  const style = useAnimatedStyle(() => (height.value < 0 ? {} : { height: height.value }));

  return (
    <Animated.View style={[styles.clip, style]}>
      <View style={[styles.bleed, measured && styles.content]} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', margin: -BLEED },
  bleed: { padding: BLEED },
  // Laid out at its natural height whatever the animated outer height is, so it can be measured.
  content: { position: 'absolute', top: 0, left: 0, right: 0 },
});
