import type { Tabs } from 'expo-router';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useStyles, useTheme } from '@/lib/theme';
import { FieldIcon, HighlightsIcon, TodayIcon } from './Icons';
import { Text } from './Text';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const PILL_HEIGHT = 58;
const PILL_PADDING = 5;
/** Space between the pill and the bottom of the screen (above the home bar). */
const BOTTOM_GAP = 6;

const ICONS: Record<string, (color: string) => ReactNode> = {
  index: (color) => <TodayIcon color={color} size={22} />,
  field: (color) => <FieldIcon color={color} size={22} />,
  highlights: (color) => <HighlightsIcon color={color} size={22} />,
};

/** Bottom padding a tab page needs so its end scrolls clear of the floating pill. */
export function useTabBarSpace() {
  const { bottom } = useSafeAreaInsets();
  return Math.max(bottom - BOTTOM_GAP, space.sm) + PILL_HEIGHT + space.md;
}

/**
 * Clover's floating pill tab bar: a solid card (white in light themes) floating over the page,
 * so it never changes colour with what's behind it. A soft highlight slides to the chosen tab.
 */
export function PillTabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const c = useTheme();
  const styles = usePillStyles();
  const [width, setWidth] = useState(0);
  const itemWidth = width > 0 ? (width - PILL_PADDING * 2) / state.routes.length : 0;
  const position = useSharedValue(state.index);

  useEffect(() => {
    position.set(withSpring(state.index, { damping: 20, stiffness: 220, mass: 0.8 }));
  }, [state.index, position]);

  const highlightStyle = useAnimatedStyle(() => ({
    width: itemWidth,
    transform: [{ translateX: PILL_PADDING + position.value * itemWidth }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - BOTTOM_GAP, space.sm) }]}
    >
      <View style={styles.pill} role="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {itemWidth > 0 && <Animated.View pointerEvents="none" style={[styles.highlight, highlightStyle]} />}
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const color = focused ? c.text : c.muted;
          // Same press handling as the standard tab bar, so tab listeners still work.
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${label}, tab, ${index + 1} of ${state.routes.length}`}
            >
              {ICONS[route.name]?.(color)}
              <Text weight={focused ? 'bold' : 'semibold'} size={10} color={color}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function usePillStyles() {
  return useStyles((c) => ({
    // Floats over the page: no background of its own, only the pill.
    wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
    pill: {
      flexDirection: 'row',
      width: '78%',
      maxWidth: 320,
      height: PILL_HEIGHT,
      padding: PILL_PADDING,
      borderRadius: PILL_HEIGHT / 2,
      backgroundColor: c.sheet,
      borderWidth: 1,
      borderColor: c.dark ? c.line : 'rgba(0, 0, 0, 0.04)',
      shadowColor: '#000000',
      shadowOpacity: c.dark ? 0.35 : 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    highlight: {
      position: 'absolute',
      top: PILL_PADDING,
      bottom: PILL_PADDING,
      left: 0,
      borderRadius: (PILL_HEIGHT - PILL_PADDING * 2) / 2,
      backgroundColor: c.dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  }));
}
