import { isRunningInExpoGo } from 'expo';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AppLock } from '@/components/AppLock';
import { OpeningAnimation, SplashScreenFrame } from '@/components/OpeningAnimation';
import { ONBOARDING_COMPLETED_KEY, Onboarding } from '@/components/Onboarding';
import { todayKey } from '@/lib/dates';
import { configureNotifications, syncReminders } from '@/lib/notifications';
import { setInputBlocked } from '@/lib/interactive';
import { fetchPlusStatus, initPurchases, onPlusStatusChange } from '@/lib/purchases';
import { StoreProvider, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();
initPurchases();

/** Keeps the scheduled reminders in step with settings, today's log and the passing days. */
function ReminderSync() {
  const { ready, settings, entries, startedOn } = useStore();
  const { reminderEnabled, yesterdayReminderEnabled, hour, minute } = settings;

  useEffect(() => {
    if (!ready) return;
    const plan = { enabled: reminderEnabled, yesterdayReminderEnabled, hour, minute, entries, startedOn };
    syncReminders(plan);
    // Top up the schedule each time the app comes back to the foreground.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && syncReminders(plan));
    return () => sub.remove();
  }, [ready, reminderEnabled, yesterdayReminderEnabled, hour, minute, entries, startedOn]);

  return null;
}

/** Keeps Clover+ in step with the `clover_plus` entitlement in RevenueCat (purchases, restores, refunds). */
function PurchasesSync() {
  const { ready, setHasPlus } = useStore();

  // Checks once at launch, then follows RevenueCat's own change events, so a local change
  // (like the developer unlock) isn't undone mid-session.
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const apply = (value: boolean) => {
      if (active) void setHasPlus(value);
    };
    // Offline or unreachable: keep the last known status rather than locking anyone out.
    fetchPlusStatus().then((value) => value !== null && apply(value));
    const unsubscribe = onPlusStatusChange(apply);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [ready, setHasPlus]);

  return null;
}

function RootNavigator() {
  const { ready, resetVersion, entries, startedOn, updateSettings, hasPlus } = useStore();
  const c = useTheme();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [opening, setOpening] = useState(true);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedResetVersion, setCompletedResetVersion] = useState(0);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => active && setReduceMotion(enabled))
      .catch(() => active && setReduceMotion(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)
      .then(async (value) => {
        if (!active) return;
        const firstLaunch = startedOn === todayKey() && Object.keys(entries).length === 0;
        const shouldShow = value !== 'true' && firstLaunch;
        if (value !== 'true' && !firstLaunch) {
          await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        }
        if (!active) return;
        setShowOnboarding(shouldShow);
        setOnboardingReady(true);
      })
      .catch((error) => {
        console.warn('Clover: onboarding state could not be loaded', error);
        if (!active) return;
        setShowOnboarding(true);
        setOnboardingReady(true);
      });
    return () => { active = false; };
  }, [ready, startedOn, entries]);

  useEffect(() => {
    if (ready && onboardingReady && reduceMotion !== null) SplashScreen.hideAsync().catch(() => {});
  }, [ready, onboardingReady, reduceMotion]);

  // Home Screen and Lock Screen widgets (iOS). Loading the module also registers each widget's
  // layout with the extension, so this runs on every launch, then whenever the data, theme or
  // Clover+ status changes, and each time the app comes back (the day may have changed).
  useEffect(() => {
    // Expo Go can't run widgets; development and App Store builds can.
    if (!ready || Platform.OS !== 'ios' || isRunningInExpoGo()) return;
    let active = true;
    const sync = () =>
      import('@/widgets/sync')
        .then(({ syncCloverWidgets }) => {
          if (active) syncCloverWidgets(entries, c, hasPlus);
        })
        .catch((error) => console.warn('Clover: widget sync is unavailable in this build', error));
    void sync();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void sync());
    return () => {
      active = false;
      sub.remove();
    };
  }, [ready, entries, c, hasPlus]);

  const finishOpening = useCallback(() => {
    setOpening(false);
    setInputBlocked('opening', false);
  }, []);
  const finishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    setCompletedResetVersion(resetVersion);
  }, [resetVersion]);
  const onboardingVisible = onboardingReady && (showOnboarding || resetVersion > completedResetVersion);
  useEffect(() => {
    setInputBlocked('onboarding', onboardingVisible);
  }, [onboardingVisible]);
  const enableDailyReminder = useCallback(() => updateSettings({ reminderEnabled: true }), [updateSettings]);

  if (!ready || !onboardingReady || reduceMotion === null) {
    return <SplashScreenFrame />;
  }

  return (
    <>
      <StatusBar style={!opening && c.dark && !showOnboarding ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="share" options={{ presentation: 'modal' }} />
      </Stack>
      <ReminderSync />
      <PurchasesSync />
      <AppLock />
      {/* Onboarding sits under the opening animation from the start, so a first launch (or a
          launch after deleting everything) fades straight into it, never into Today. */}
      {onboardingVisible && (
        <Onboarding
          onComplete={finishOnboarding}
          onNotificationsEnabled={enableDailyReminder}
          reduceMotion={reduceMotion}
        />
      )}
      {opening && <OpeningAnimation reduceMotion={reduceMotion} onFinish={finishOpening} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <StoreProvider>
        <RootNavigator />
      </StoreProvider>
    </KeyboardProvider>
  );
}
