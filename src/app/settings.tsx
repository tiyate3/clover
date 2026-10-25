import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCalendars } from 'expo-localization';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clover } from '@/components/Clover';
import { CheckIcon, LockIcon } from '@/components/Icons';
import { ONBOARDING_COMPLETED_KEY } from '@/components/Onboarding';
import { PlanBadge } from '@/components/PlusBadge';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PlusCard } from '@/components/PlusCard';
import { Text } from '@/components/Text';
import { formatTime } from '@/lib/dates';
import { notificationsAllowed } from '@/lib/notifications';
import { clearSimulatedPurchase, restorePlus } from '@/lib/purchases';
import { Appearance, useStore } from '@/lib/store';
import { radius, softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';
import { previewPalette, ThemeId, THEMES } from '@/lib/themes';

const notify = (title: string, message: string) =>
  Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

const openPaywall = (feature: 'themes' | 'faceid') => router.push({ pathname: '/paywall', params: { feature } });
const APPEARANCES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'Automatic'],
] as const satisfies readonly (readonly [Appearance, string])[];

const PRIVACY_POLICY_URL = 'https://clover-privacy-policy.teshmaru.workers.dev/';

export default function SettingsScreen() {
  const { settings, updateSettings, hasPlus, setHasPlus, resetAppData, demoMode, setDemoMode } = useStore();
  const c = useTheme();
  const styles = useSettingsStyles();
  const [notice, setNotice] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [biometricName, setBiometricName] = useState('Face ID');
  const { reminderEnabled, yesterdayReminderEnabled, hour, minute, appearance, theme, faceIdLock } = settings;
  // Follows the phone's own 12/24-hour clock setting.
  const uses24h = useCalendars()[0]?.uses24hourClock ?? null;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      if (!face && finger) setBiometricName('Touch ID');
    });
  }, []);

  // Reminders are rescheduled automatically (see ReminderSync in the root layout) whenever these change.
  const toggleReminder = async (on: boolean) => {
    setNotice(null);
    if (!on) return updateSettings({ reminderEnabled: false });
    if (Platform.OS === 'web') return setNotice('Reminders work on your phone, not in the browser.');
    if (!(await notificationsAllowed())) {
      return setNotice('Notifications are off. Allow them in your device Settings to receive reminders.');
    }
    await updateSettings({ reminderEnabled: true });
  };

  const toggleYesterdayReminder = async (on: boolean) => {
    setNotice(null);
    if (!on) return updateSettings({ yesterdayReminderEnabled: false });
    if (Platform.OS === 'web') return setNotice('Reminders work on your phone, not in the browser.');
    if (!(await notificationsAllowed())) {
      return setNotice('Notifications are off. Allow them in your device Settings to receive reminders.');
    }
    await updateSettings({ yesterdayReminderEnabled: true });
  };

  const setTime = (totalMinutes: number) => {
    const total = ((totalMinutes % 1440) + 1440) % 1440;
    updateSettings({ hour: Math.floor(total / 60), minute: total % 60 });
  };

  const chooseTheme = (id: ThemeId, paid: boolean) => {
    if (paid && !hasPlus) return openPaywall('themes');
    updateSettings({ theme: id });
  };

  const toggleFaceId = async (on: boolean) => {
    if (!hasPlus) return openPaywall('faceid');
    if (!on) return updateSettings({ faceIdLock: false });
    if (Platform.OS === 'web') return notify(`${biometricName} lock`, 'This works on your iPhone.');
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hardware || !enrolled) {
      return notify(`${biometricName} isn’t set up`, `Set up ${biometricName} in your iPhone Settings first.`);
    }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: `Turn on ${biometricName} lock` });
    if (result.success) await updateSettings({ faceIdLock: true });
  };

  const onRestore = async () => {
    setRestoring(true);
    try {
      if (await restorePlus()) {
        await setHasPlus(true);
        notify('Clover+ restored', 'Everything is unlocked again.');
      } else {
        notify('Nothing to restore', 'We couldn’t find a Clover+ purchase for this Apple ID.');
      }
    } finally {
      setRestoring(false);
    }
  };

  const resetForNewUser = () => {
    const reset = async () => {
      await AsyncStorage.multiRemove([
        ONBOARDING_COMPLETED_KEY,
        'clover:reviewPrompt:v1',
        'clover:reminderDeck:v1',
      ]);
      await clearSimulatedPurchase();
      await resetAppData();
    };
    Alert.alert('Reset app data?', 'This clears your entries and settings and restarts onboarding.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => void reset() },
    ]);
  };

  /** For everyone: wipes this iPhone's Clover data and starts over. A bought Clover+ stays unlocked. */
  // The standard iPhone alert, like deleting an app: Cancel, and a red Reset Clover.
  const deleteAllData = () => {
    const wipe = async () => {
      try {
        await AsyncStorage.multiRemove([ONBOARDING_COMPLETED_KEY, 'clover:reviewPrompt:v1', 'clover:reminderDeck:v1']);
        await resetAppData({ keepPlus: true });
        router.back();
      } catch (error) {
        console.warn('Clover: deleting data failed', error);
        notify('Couldn’t delete your data', 'Please try again.');
      }
    };
    const title = 'Delete all data?';
    const message =
      'This permanently deletes all your entries and settings from this iPhone and resets Clover. This action cannot be undone.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${title}\n\n${message}`)) void wipe();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset Clover', style: 'destructive', onPress: () => void wipe() },
    ]);
  };

  const minutes = hour * 60 + minute;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text weight="extrabold" size={28} style={titleShadow(c)}>
            Settings
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.done}>
            <Text weight="bold" size={15}>
              Done
            </Text>
          </Pressable>
        </View>

        {!hasPlus && (
          <>
            <PlusCard onPress={() => router.push('/paywall')} biometricName={biometricName} />
            <View style={styles.plusDivider} />
          </>
        )}

        {/* Reminders — free */}
        <Section title="Notifications">
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={17}>
                Daily reminders
              </Text>
              <Text size={13} color={c.muted}>
                A nudge to log today’s good thing
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ false: c.faint, true: c.cloverFill }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.faint}
            />
          </View>
          <View style={styles.divider} />
          <View style={[styles.row, !reminderEnabled && styles.dim]} pointerEvents={reminderEnabled ? 'auto' : 'none'}>
            <Text weight="bold" size={17} style={{ flex: 1 }}>
              Time
            </Text>
            <View style={styles.stepper}>
              <StepButton label="−" onPress={() => setTime(minutes - 15)} />
              <Text weight="extrabold" size={18} style={styles.time}>
                {formatTime(hour, minute, uses24h)}
              </Text>
              <StepButton label="+" onPress={() => setTime(minutes + 15)} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={17}>
                Yesterday’s reminder
              </Text>
              <Text size={13} color={c.muted}>
                Get a reminder and save your streak
              </Text>
            </View>
            <Switch
              value={yesterdayReminderEnabled}
              onValueChange={toggleYesterdayReminder}
              trackColor={{ false: c.faint, true: c.cloverFill }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.faint}
            />
          </View>
        </Section>

        {notice && (
          <View style={styles.notice}>
            <Text size={14}>{notice}</Text>
            {Platform.OS !== 'web' && notice.includes('Settings') && (
              <Pressable onPress={() => Linking.openSettings()} hitSlop={8}>
                <Text weight="extrabold" size={14} style={{ marginTop: 6 }}>
                  Open Settings
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Appearance — free */}
        <Section title="Dark mode">
          <SegmentedControl
            options={APPEARANCES}
            value={appearance}
            onChange={(value) => updateSettings({ appearance: value })}
          />
          <Text size={13} color={c.muted}>
            {theme !== 'classic' && hasPlus
              ? 'Applies to the Classic theme. Other themes have their own colours.'
              : 'Automatic follows your iPhone’s setting.'}
          </Text>
        </Section>

        {/* Themes — Clover+ (Classic is free) */}
        <Section title="Themes" plan="plus">
          <View style={styles.themeGrid}>
            {THEMES.map((t) => {
              const p = previewPalette(t.id);
              const selected = (hasPlus || !t.paid) && theme === t.id;
              const locked = t.paid && !hasPlus;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => chooseTheme(t.id, t.paid)}
                  style={[styles.themeCard, selected && { borderColor: c.text, borderWidth: 2 }]}
                  accessibilityLabel={`${t.name} theme${locked ? ', Clover+' : ''}${selected ? ', selected' : ''}`}
                >
                  {/* A tiny Today screen in the theme's own colours, so the themes are easy to tell apart. */}
                  <View style={[styles.themePreview, { backgroundColor: p.background }]}>
                    <View style={[styles.miniCard, { backgroundColor: p.surface, borderColor: p.line }]}>
                      <View style={[styles.miniClover, { backgroundColor: p.soft }]}>
                        <Clover size={22} variant="filled" palette={p} />
                      </View>
                      <View style={styles.miniLines}>
                        <View style={[styles.miniLine, { width: '80%', backgroundColor: p.text }]} />
                        <View style={[styles.miniLine, { width: '55%', backgroundColor: p.muted, opacity: 0.7 }]} />
                      </View>
                    </View>
                    <View style={[styles.miniButton, { backgroundColor: p.primary }]}>
                      <View style={[styles.miniButtonLabel, { backgroundColor: p.onPrimary }]} />
                    </View>
                    {locked && (
                      <View style={styles.themeBadge}>
                        <LockIcon color="#FFFFFF" size={11} />
                      </View>
                    )}
                    {selected && (
                      <View style={[styles.themeBadge, { backgroundColor: c.text }]}>
                        <CheckIcon color={c.background} size={12} />
                      </View>
                    )}
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                    <Text weight="bold" size={14}>
                      {t.name}
                    </Text>
                    <Text size={11} color={c.muted} numberOfLines={1}>
                      {t.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Privacy — Clover+ */}
        <Section title="Privacy" plan="plus">
          <Pressable style={styles.row} onPress={() => !hasPlus && openPaywall('faceid')}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={17}>
                {biometricName} lock
              </Text>
              <Text size={13} color={c.muted}>
                Ask for {biometricName} when Clover opens
              </Text>
            </View>
            <Switch
              value={hasPlus && faceIdLock}
              onValueChange={toggleFaceId}
              trackColor={{ false: c.faint, true: c.cloverFill }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.faint}
            />
          </Pressable>
        </Section>

        {/* Purchases */}
        <View style={styles.card}>
          <Pressable onPress={onRestore} disabled={restoring} style={styles.row}>
            <Text weight="bold" size={17} style={{ flex: 1 }}>
              Restore purchase
            </Text>
            {restoring && <ActivityIndicator color={c.muted} />}
          </Pressable>
        </View>

        {__DEV__ && (
          <Section title="Temporary developer tools">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" size={15}>
                  Demo data
                </Text>
                <Text size={13} color={c.muted}>
                  Sample entries for recordings. Your real entries come back when it’s off.
                </Text>
              </View>
              <Switch
                value={demoMode}
                onValueChange={(on) => void setDemoMode(on)}
                trackColor={{ false: c.faint, true: c.cloverFill }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={c.faint}
              />
            </View>
            <View style={styles.divider} />
            <Pressable
              onPress={async () => {
                await setHasPlus(true);
                notify('Clover+ enabled', 'Temporary developer access is on for this install.');
              }}
              style={styles.row}
            >
              <Text weight="semibold" size={15} style={{ flex: 1 }}>
                Enable Clover+ temporarily
              </Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={resetForNewUser} style={styles.row}>
              <Text weight="semibold" size={15} color={c.muted} style={{ flex: 1 }}>
                Reset app data and onboarding
              </Text>
            </Pressable>
          </Section>
        )}

        <Text size={13} color={c.muted} style={styles.footer}>
    Your moments are private and stay on your device. Clover doesn’t require an account or store your entries on its own servers.
        </Text>
        <View style={styles.footerLinks}>
          <Pressable
            onPress={() => router.push('/feedback')}
            accessibilityRole="link"
            accessibilityLabel="Feedback and Suggestions"
            hitSlop={8}
            style={styles.footerLink}
          >
            <Text weight="semibold" size={14} color={c.text}>
              Feedback &amp; Suggestions
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy"
            hitSlop={8}
            style={styles.footerLink}
          >
            <Text weight="semibold" size={14} color={c.text}>
              Privacy Policy
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={deleteAllData}
          accessibilityRole="button"
          accessibilityHint="Permanently deletes all your entries and settings"
          hitSlop={8}
          style={styles.deleteAll}
        >
          <Text weight="semibold" size={14} color={c.dark ? '#F2A39B' : '#B4473B'}>
            Delete all data
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A titled settings group. Paid groups show the Clover+ badge; free ones show nothing. */
function Section({ title, plan, children }: { title: string; plan?: 'plus'; children: ReactNode }) {
  const styles = useSettingsStyles();
  const c = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      <View style={styles.sectionHeader}>
        <Text weight="semibold" size={15} color={c.text}>
          {title}
        </Text>
        {plan && <PlanBadge />}
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useSettingsStyles();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={styles.stepBtn}
      accessibilityLabel={label === '+' ? 'Later' : 'Earlier'}
    >
      <Text weight="extrabold" size={20} style={{ lineHeight: 24 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function useSettingsStyles() {
  return useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    done: { backgroundColor: c.soft, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 9 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.line,
      padding: space.md,
      gap: space.sm,
      ...softShadow(c),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    dim: { opacity: 0.4 },
    divider: { height: 1, backgroundColor: c.line, marginVertical: 4 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    time: { minWidth: 92, textAlign: 'center' },
    notice: { backgroundColor: c.goldSoft, borderRadius: radius.md, padding: space.md },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    themeCard: {
      width: '47%',
      flexGrow: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.sheet,
      overflow: 'hidden',
      ...softShadow(c),
    },
    themePreview: { height: 96, padding: 10, gap: 7, justifyContent: 'center' },
    miniCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 6,
      borderRadius: 10,
      borderWidth: 1,
    },
    miniClover: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    miniLines: { flex: 1, gap: 5 },
    miniLine: { height: 5, borderRadius: 3 },
    miniButton: { height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    miniButtonLabel: { width: 30, height: 4, borderRadius: 2, opacity: 0.85 },
    themeBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: { textAlign: 'center', marginTop: space.sm },
    footerLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs, marginTop: space.xs },
    footerLink: { paddingVertical: space.xs },
    // Pulled up close under the links, rather than a full section gap below them.
    plusDivider: { height: 1, backgroundColor: c.line, marginTop: space.xs },
    deleteAll: { alignSelf: 'center', paddingVertical: space.xs, marginTop: -space.sm, marginBottom: space.md },
  }));
}
