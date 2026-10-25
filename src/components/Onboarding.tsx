import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clover } from '@/components/Clover';
import { Text } from '@/components/Text';
import { ensurePermission } from '@/lib/notifications';
import { Palette, resolvePalette } from '@/lib/themes';
import { space } from '@/lib/theme';

export const ONBOARDING_COMPLETED_KEY = 'clover:onboarding:completed:v1';
const ONBOARDING_BACKGROUND = '#FCFCFC';

const PAGES = [
  { title: 'Make room for good luck', body: 'Keep track of the little things and make everyday feel lucky.' },
  { title: 'How it works', body: 'Log one thing each day and watch your calendar fill up.' },
  { title: 'Extra lucky days', body: 'Mark your luckiest days with a golden four-leaf clover.' },
  {
    title: 'Reminders',
    body: 'Set a daily reminder to log your entry. Change the time or turn it off anytime in Settings.',
  },
];
const LAST = PAGES.length - 1;

type Props = {
  onComplete: () => void;
  onNotificationsEnabled: () => Promise<void>;
  reduceMotion: boolean;
};

/**
 * Swipe between pages or tap Continue. The pages are a native paging scroll, so a swipe follows
 * the finger exactly. The progress pill, parallax and button label all read that same scroll
 * position on the UI thread, so everything moves together.
 */
export function Onboarding({ onComplete, onNotificationsEnabled, reduceMotion }: Props) {
  const c = resolvePalette('classic', false, false);
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const finishing = useRef(false);

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      console.warn('Clover: onboarding completion could not be saved', error);
    } finally {
      onComplete();
    }
  };

  const skip = () => void finish();

  const settle = (nextPage: number) => {
    if (nextPage === page) return;
    setPage(nextPage);
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
  };

  const goTo = (nextPage: number) => {
    if (nextPage < 0 || nextPage > LAST) return;
    scrollRef.current?.scrollTo({ x: nextPage * width, animated: !reduceMotion });
    settle(nextPage);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    settle(Math.round(e.nativeEvent.contentOffset.x / width));

  // The live position, so a tap mid-swipe acts on the page actually showing.
  const showing = () => (width > 0 ? Math.round(offset.get() / width) : page);

  const allowNotifications = async () => {
    setBusy(true);
    try {
      if (await ensurePermission()) await onNotificationsEnabled();
    } catch (error) {
      console.warn('Clover: notification permission request failed', error);
    } finally {
      await finish();
    }
  };

  const onPrimary = () => {
    const current = showing();
    if (current >= LAST) void allowNotifications();
    else goTo(current + 1);
  };

  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(width > 0 ? offset.value / width : 0, [0, 0.6], [0, 1], Extrapolation.CLAMP),
  }));
  const continueStyle = useAnimatedStyle(() => ({
    opacity: interpolate(width > 0 ? offset.value / width : 0, [LAST - 0.6, LAST - 0.1], [1, 0], Extrapolation.CLAMP),
  }));
  const allowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(width > 0 ? offset.value / width : 0, [LAST - 0.6, LAST - 0.1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[StyleSheet.absoluteFill, styles.screen, { backgroundColor: ONBOARDING_BACKGROUND }]}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Animated.View style={backStyle} pointerEvents={page > 0 ? 'auto' : 'none'}>
            <Pressable
              onPress={() => goTo(showing() - 1)}
              disabled={busy}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityElementsHidden={page === 0}
            >
              <Text weight="semibold" size={15} color={c.muted}>
                Back
              </Text>
            </Pressable>
          </Animated.View>
          <View style={styles.progress} accessibilityLabel={`Screen ${page + 1} of ${PAGES.length}`}>
            {PAGES.map((_, index) => (
              <ProgressDot key={index} index={index} offset={offset} width={width} palette={c} />
            ))}
          </View>
          <Pressable onPress={skip} disabled={busy} hitSlop={10} accessibilityRole="button">
            <Text weight="semibold" size={15} color={c.muted}>
              Skip
            </Text>
          </Pressable>
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEnabled={!busy}
          style={styles.pager}
        >
          {PAGES.map((p, index) => (
            <OnboardingPage key={p.title} index={index} offset={offset} width={width} palette={c} reduceMotion={reduceMotion} />
          ))}
        </Animated.ScrollView>

        <Pressable
          onPress={onPrimary}
          disabled={busy}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: c.primary, opacity: busy ? 0.7 : pressed ? 0.88 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel={page === LAST ? 'Allow notifications' : 'Continue'}
        >
          {/* Both labels share the button and cross-fade as the last page slides in. */}
          <Animated.View style={[styles.buttonLabel, continueStyle]}>
            <Text weight="bold" size={16} color={c.onPrimary}>
              Continue
            </Text>
          </Animated.View>
          <Animated.View style={[styles.buttonLabel, allowStyle]}>
            <Text weight="bold" size={16} color={c.onPrimary}>
              Allow notifications
            </Text>
          </Animated.View>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

/** Fills in once reached, and stretches into a pill while it's the page showing. */
function ProgressDot({ index, offset, width, palette }: { index: number; offset: SharedValue<number>; width: number; palette: Palette }) {
  const style = useAnimatedStyle(() => {
    const pos = width > 0 ? offset.value / width : 0;
    return {
      width: interpolate(pos, [index - 1, index, index + 1], [7, 20, 7], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(Math.min(1, Math.max(0, pos - index + 1)), [0, 1], [palette.faint, palette.cloverFill]),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * One page. As it slides, the illustration drifts a little slower than the text (parallax),
 * eases down in size and fades, so pages hand over softly. Reduce Motion keeps just the fade.
 */
function OnboardingPage({
  index,
  offset,
  width,
  palette: c,
  reduceMotion,
}: {
  index: number;
  offset: SharedValue<number>;
  width: number;
  palette: Palette;
  reduceMotion: boolean;
}) {
  const page = PAGES[index];
  const illustrationStyle = useAnimatedStyle(() => {
    const p = width > 0 ? offset.value / width - index : 0;
    const distance = Math.min(1, Math.abs(p));
    return {
      opacity: 1 - distance * 0.7,
      transform: reduceMotion ? [] : [{ translateX: p * width * 0.35 }, { scale: 1 - distance * 0.12 }],
    };
  });
  const copyStyle = useAnimatedStyle(() => {
    const p = width > 0 ? offset.value / width - index : 0;
    const distance = Math.min(1, Math.abs(p));
    return {
      opacity: 1 - distance * 0.85,
      transform: reduceMotion ? [] : [{ translateX: p * width * 0.12 }],
    };
  });

  return (
    <View style={[styles.content, { width }]}>
      <Animated.View style={[styles.illustration, illustrationStyle]}>
        {index === 1 ? (
          <CalendarIllustration color={c.cloverStroke} accent={c.gold} soft={c.soft} />
        ) : index === 3 ? (
          <ClockIllustration color={c.cloverStroke} accent={c.gold} soft={c.soft} />
        ) : (
          <Clover size={112} variant={index === 2 ? 'lucky' : 'filled'} palette={c} />
        )}
      </Animated.View>
      <Animated.View style={[styles.copy, copyStyle]}>
        <Text weight="bold" size={27} color="#1F3D28" style={styles.title}>
          {page.title}
        </Text>
        <Text size={17} color={c.muted} style={styles.body}>
          {page.body}
        </Text>
      </Animated.View>
    </View>
  );
}

function CalendarIllustration({ color, accent, soft }: { color: string; accent: string; soft: string }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: soft }]}>
      <Svg width={76} height={76} viewBox="0 0 76 76" fill="none">
        <Rect x="12" y="16" width="52" height="48" rx="11" fill="#FCFCFC" stroke={color} strokeWidth="2.5" />
        <Path d="M12 29h52" stroke={color} strokeWidth="2.5" />
        <Line x1="25" y1="11" x2="25" y2="21" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <Line x1="51" y1="11" x2="51" y2="21" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <Circle cx="27" cy="40" r="3.2" fill={color} opacity="0.72" />
        <Circle cx="38" cy="40" r="3.2" fill={accent} />
        <Circle cx="49" cy="40" r="3.2" fill={color} opacity="0.72" />
        <Circle cx="27" cy="51" r="3.2" fill={accent} />
        <Circle cx="38" cy="51" r="3.2" fill={color} opacity="0.32" />
        <Circle cx="49" cy="51" r="3.2" fill={color} opacity="0.32" />
      </Svg>
    </View>
  );
}

function ClockIllustration({ color, accent, soft }: { color: string; accent: string; soft: string }) {
  return (
    <View style={[styles.iconTile, { backgroundColor: soft }]}>
      <Svg width={76} height={76} viewBox="0 0 76 76" fill="none">
        <Circle cx="38" cy="39" r="24" fill="#FCFCFC" stroke={color} strokeWidth="2.5" />
        <Path d="M38 23v16l11 7" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="38" cy="39" r="3.2" fill={accent} />
        <Path d="M28 11h20" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
        <Path d="m57 18 3 3" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { zIndex: 2000 },
  // The pager runs edge to edge so a swipe can start anywhere; the rest keeps the usual margins.
  safe: { flex: 1, paddingBottom: space.lg },
  topRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  progress: { flexDirection: 'row', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pager: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 34, paddingHorizontal: space.lg + space.sm },
  illustration: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  iconTile: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', borderRadius: 30 },
  copy: { alignItems: 'center', gap: space.sm },
  title: { textAlign: 'center', lineHeight: 34, maxWidth: 330 },
  body: { textAlign: 'center', lineHeight: 25, maxWidth: 320 },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginBottom: space.sm,
    marginHorizontal: space.lg,
  },
  buttonLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
