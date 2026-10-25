import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { radius, useStyles, useTheme } from '@/lib/theme';
import { Text } from './Text';

const PADDING = 4;

type Props<T extends string> = {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
};

/** A row of choices where the highlight glides to the one you pick, like the tab bar's. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const c = useTheme();
  const styles = useSegmentStyles();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex(([v]) => v === value));
  const itemWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const position = useSharedValue(index);

  useEffect(() => {
    position.set(withSpring(index, { damping: 20, stiffness: 220, mass: 0.8 }));
  }, [index, position]);

  const highlightStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: PADDING + position.value * itemWidth }],
  }));

  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="radiogroup">
      {itemWidth > 0 && <Animated.View pointerEvents="none" style={[styles.highlight, highlightStyle]} />}
      {options.map(([option, label]) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={styles.item}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text weight="bold" size={14} color={active ? c.onPrimary : c.text}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function useSegmentStyles() {
  return useStyles((c) => ({
    track: { flexDirection: 'row', backgroundColor: c.soft, borderRadius: radius.pill, padding: PADDING },
    highlight: { position: 'absolute', top: PADDING, bottom: PADDING, left: 0, borderRadius: radius.pill, backgroundColor: c.primary },
    item: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  }));
}
