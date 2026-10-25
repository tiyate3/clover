import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayEntries } from '@/components/DayEntries';
import { FillingClover } from '@/components/FillingClover';
import { FormScrollView } from '@/components/FormScrollView';
import { GearIcon } from '@/components/Icons';
import { Text } from '@/components/Text';
import { useTabBarSpace } from '@/components/PillTabBar';
import { currentStreak, formatLongDate, fromKey, todayKey, toKey } from '@/lib/dates';
import { countsForStreak, isLuckyDay, useStore } from '@/lib/store';
import { duration, fadeTiming } from '@/lib/motion';
import { softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';
import { useToday } from '@/lib/useToday';

const REVIEW_KEY = 'clover:reviewPrompt:v1';
const REVIEW_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;

type ReviewPromptState = {
  firstUsedOn: string;
  shownCount: number;
  snoozedUntil: number | null;
  finished: boolean;
};

export default function TodayScreen() {
  const c = useTheme();
  // Room at the end so the page scrolls clear of the floating tab bar.
  const tabBarSpace = useTabBarSpace();
  const styles = useScreenStyles();
  const { entries, startedOn } = useStore();
  const { focusInput } = useLocalSearchParams<{ focusInput?: string }>();
  const key = useToday();
  const items = entries[key] ?? [];
  const hasItems = items.length > 0;
  const luckyDay = isLuckyDay(items);
  const streak = currentStreak((k) => countsForStreak(k, entries[k]));
  // The status line keeps its space and fades in, so saving never nudges the layout.
  const collected = useSharedValue(hasItems ? 1 : 0);
  const collectedStyle = useAnimatedStyle(() => ({ opacity: collected.value }));

  const [reviewState, setReviewState] = useState<ReviewPromptState | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const reviewLock = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REVIEW_KEY);
        const state: ReviewPromptState = raw
          ? JSON.parse(raw)
          : { firstUsedOn: startedOn, shownCount: 0, snoozedUntil: null, finished: false };
        if (!raw) await AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(state));
        if (active) setReviewState(state);
      } catch (error) {
        console.warn('Clover: review prompt state could not be loaded', error);
        if (active) {
          setReviewState({ firstUsedOn: startedOn, shownCount: 0, snoozedUntil: null, finished: false });
        }
      }
    })();
    return () => { active = false; };
  }, [startedOn]);

  useEffect(() => {
    collected.set(withTiming(hasItems ? 1 : 0, fadeTiming(duration.fill)));
  }, [hasItems, collected]);

  const checkReviewEligibility = async (loggedDays: number) => {
    if (reviewLock.current || reviewVisible) return;
    let current: ReviewPromptState;
    if (reviewState) {
      current = reviewState;
    } else {
      try {
        const raw = await AsyncStorage.getItem(REVIEW_KEY);
        current = raw
          ? JSON.parse(raw)
          : { firstUsedOn: startedOn, shownCount: 0, snoozedUntil: null, finished: false };
      } catch {
        current = { firstUsedOn: startedOn, shownCount: 0, snoozedUntil: null, finished: false };
      }
      setReviewState(current);
    }
    if (current.finished || current.shownCount >= 2 || loggedDays < 7) return;

    const eligibleOn = fromKey(current.firstUsedOn);
    eligibleOn.setDate(eligibleOn.getDate() + 7);
    if (todayKey() < toKey(eligibleOn)) return;
    const isFirstShow = current.shownCount === 0;
    const snoozeElapsed = current.shownCount === 1 && current.snoozedUntil !== null && Date.now() >= current.snoozedUntil;
    if (!isFirstShow && !snoozeElapsed) return;

    reviewLock.current = true;
    const next = { ...current, shownCount: current.shownCount + 1 };
    setReviewState(next);
    setReviewVisible(true);
    AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(next)).catch((error) =>
      console.warn('Clover: review prompt state could not be saved', error),
    );
  };

  const onSaved = (added: boolean, loggedDays?: number) => {
    if (added && loggedDays !== undefined) void checkReviewEligibility(loggedDays);
  };

  const closeReview = (next: ReviewPromptState) => {
    reviewLock.current = false;
    setReviewVisible(false);
    setReviewState(next);
    AsyncStorage.setItem(REVIEW_KEY, JSON.stringify(next)).catch((error) =>
      console.warn('Clover: review prompt state could not be saved', error),
    );
  };

  const onMaybeLater = () => {
    if (!reviewState) return;
    closeReview(
      reviewState.shownCount === 1
        ? { ...reviewState, snoozedUntil: Date.now() + REVIEW_SNOOZE_MS }
        : { ...reviewState, finished: true },
    );
  };

  const onLeaveReview = () => {
    if (reviewState) closeReview({ ...reviewState, finished: true });
    setTimeout(async () => {
      try {
        if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
      } catch (error) {
        console.warn('Clover: review request failed', error);
      }
    }, 350);
  };

  const onNoThanks = () => {
    if (reviewState) closeReview({ ...reviewState, finished: true });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Moves in step with the keyboard; tapping any empty space dismisses it. */}
      <FormScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        topOnLeave
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text weight="semibold" size={14} color={c.muted}>
              {streak > 0 ? `${streak}-day streak` : 'One good thing a day'}
            </Text>
            <Text weight="extrabold" size={26} style={titleShadow(c)}>
              {formatLongDate(fromKey(key))}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={styles.gear} accessibilityLabel="Settings">
            <GearIcon color={c.dark ? '#AEAEB2' : '#6E6E73'} size={22} />
          </Pressable>
        </View>

        <View style={styles.cloverWrap}>
          <FillingClover size={200} filled={hasItems} lucky={luckyDay} shrinkTo={0.75} halo />
        </View>

        <Animated.View style={collectedStyle} accessibilityElementsHidden={!hasItems} importantForAccessibility={hasItems ? 'auto' : 'no-hide-descendants'}>
          <Text weight="bold" size={14} color={luckyDay ? c.goldStroke : c.cloverFill} style={{ textAlign: 'center' }}>
            {luckyDay ? 'Extra lucky day' : 'Clover collected'}
            {items.length > 1 ? ` · ${items.length} good things` : ''}
          </Text>
        </Animated.View>
        <DayEntries
          key={key}
          day={key}
          openWhenEmpty
          openInput={focusInput === '1'}
          onCloseInput={() => focusInput === '1' && router.setParams({ focusInput: undefined })}
          onSaved={onSaved}
        />
      </FormScrollView>
      <EnjoyingPrompt
        visible={reviewVisible}
        onLeaveReview={onLeaveReview}
        onMaybeLater={onMaybeLater}
        onNoThanks={onNoThanks}
      />
    </SafeAreaView>
  );
}

function EnjoyingPrompt({
  visible,
  onLeaveReview,
  onMaybeLater,
  onNoThanks,
}: {
  visible: boolean;
  onLeaveReview: () => void;
  onMaybeLater: () => void;
  onNoThanks: () => void;
}) {
  const c = useTheme();
  const styles = useScreenStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onMaybeLater}>
      <View style={styles.promptBackdrop}>
        <View style={styles.promptCard}>
          <Text weight="bold" size={21} style={{ textAlign: 'center' }}>
            Enjoying Clover?
          </Text>
          <Text size={15} color={c.muted} style={{ textAlign: 'center', lineHeight: 22 }}>
            We’d love to hear what you think. If Clover has become a little part of your day, we’d love it if you left us a review.
          </Text>
          <Pressable onPress={onLeaveReview} style={styles.reviewButton} accessibilityRole="button">
            <Text weight="bold" size={16} color={c.onPrimary}>
              Leave a review
            </Text>
          </Pressable>
          <View style={styles.reviewActions}>
            <Pressable onPress={onMaybeLater} style={styles.reviewSecondary} accessibilityRole="button">
              <Text weight="semibold" size={14} color={c.text}>
                Maybe later
              </Text>
            </Pressable>
            <Pressable onPress={onNoThanks} style={styles.reviewSecondary} accessibilityRole="button">
              <Text weight="semibold" size={14} color={c.muted}>
                No thanks
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function useScreenStyles() {
  return useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: space.lg, paddingBottom: space.xl, gap: space.lg, flexGrow: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
    gear: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.dark ? '#38383C' : '#F0F0F2', alignItems: 'center', justifyContent: 'center' },
    cloverWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: space.xs },
    promptBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg, backgroundColor: 'rgba(0,0,0,0.32)' },
    promptCard: { width: '100%', maxWidth: 360, gap: space.md, alignItems: 'stretch', backgroundColor: c.surface, borderRadius: 24, padding: space.lg, ...softShadow(c) },
    reviewButton: { alignItems: 'center', backgroundColor: c.primary, borderRadius: 999, paddingVertical: 15 },
    reviewActions: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
    reviewSecondary: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  }));
}
