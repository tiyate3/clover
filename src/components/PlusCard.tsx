import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { usePlusPrice } from '@/lib/purchases';
import { radius, space } from '@/lib/theme';
import { ChevronIcon } from './Icons';
import { Text } from './Text';

const GOLD = '#E4C27A';
const INK = '#3B2A08';
const SHINE_WIDTH = 90;

type Props = { onPress: () => void; biometricName: string };

/**
 * The Clover+ invitation at the top of Settings: a soft gold gradient with a grey shadow, a dark
 * price tag, and a slow shine across it every few seconds. The same gold in every theme.
 */
export function PlusCard({ onPress, biometricName }: Props) {
  const price = usePlusPrice();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || width === 0) return;
    shine.set(0);
    shine.set(withRepeat(withDelay(2800, withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.quad) })), -1, false));
  }, [reduceMotion, width, shine]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -SHINE_WIDTH + shine.value * (width + SHINE_WIDTH * 2) }, { skewX: '-20deg' }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Clover+. All themes, widgets, ${biometricName} lock and more. ${price}, one time.`}
    >
      <View style={styles.clip}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="plusCardGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#ECD8A4" />
              <Stop offset="0.5" stopColor="#DFC385" />
              <Stop offset="1" stopColor="#CBAA68" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#plusCardGold)" />
        </Svg>
        {!reduceMotion && (
          <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]}>
            <Svg width={SHINE_WIDTH} height="100%">
              <Defs>
                <LinearGradient id="plusCardShine" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
                  <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.45} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#plusCardShine)" />
            </Svg>
          </Animated.View>
        )}
      </View>

      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text weight="extrabold" size={17} color={INK}>
            Clover+
          </Text>
          <View style={styles.priceTag}>
            <Text weight="bold" size={11} color={GOLD}>
              {price} once
            </Text>
          </View>
        </View>
        <Text size={13} color="#5E4718" numberOfLines={2}>
          All themes, widgets, {biometricName} lock and more. Yours forever.
        </Text>
      </View>
      {/* Wrapped so it stacks above the gradient layer (a bare SVG draws beneath it on web). */}
      <View>
        <ChevronIcon color={INK} size={20} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.lg,
    // Slim: a little vertical padding, the usual side padding.
    paddingVertical: space.sm,
    paddingHorizontal: space.md + 4,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  clip: { ...StyleSheet.absoluteFill, borderRadius: radius.lg, overflow: 'hidden' },
  shine: { position: 'absolute', top: -10, bottom: -10, left: 0, width: SHINE_WIDTH },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  priceTag: { backgroundColor: INK, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
});
