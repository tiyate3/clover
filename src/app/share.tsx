import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, PixelRatio, Platform, Pressable, ScrollView, Switch, View, ViewInstance } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { Clover } from '@/components/Clover';
import { CheckIcon, ShareIcon } from '@/components/Icons';
import { SHARE_HEIGHT, SHARE_WIDTH, ShareCard } from '@/components/ShareCard';
import { Text } from '@/components/Text';
import { formatMonth, formatShortDate } from '@/lib/dates';
import { monthStats } from '@/lib/monthStats';
import { useStore } from '@/lib/store';
import { radius, softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';

const MAX_MOMENTS = 3;

const notify = (title: string, message: string) =>
  Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

export default function ShareScreen() {
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth();

  const c = useTheme();
  const styles = useScreenStyles();
  // The bottom inset is applied by hand, so the share button sits just above the home bar.
  const { bottom } = useSafeAreaInsets();
  const { entries, startedOn } = useStore();
  const stats = monthStats(entries, year, month);
  const cardRef = useRef<ViewInstance>(null);

  // Entries can be personal: the user picks exactly which ones appear, or hides all text.
  const [hideText, setHideText] = useState(false);
  const [chosen, setChosen] = useState<string[]>(() =>
    stats.moments
      .filter((m) => m.item.extraLucky)
      .slice(0, MAX_MOMENTS)
      .map((m) => m.item.id),
  );
  const [sharing, setSharing] = useState(false);

  const shownMoments = hideText ? [] : stats.moments.filter((m) => chosen.includes(m.item.id));

  const toggle = (id: string) =>
    setChosen((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= MAX_MOMENTS) return cur;
      return [...cur, id];
    });

  const onShare = async () => {
    if (Platform.OS === 'web' || !(await Sharing.isAvailableAsync())) {
      return notify('Share my month', 'Sharing works on your iPhone.');
    }
    setSharing(true);
    try {
      // Render at 1080×1920 so it's crisp in Instagram/TikTok stories.
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        width: 1080 / PixelRatio.get(),
        height: 1920 / PixelRatio.get(),
      });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share my month' });
    } catch (e) {
      console.warn('Clover: share failed', e);
      notify('Couldn’t share', 'Something went wrong making the image. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text weight="extrabold" size={22} style={titleShadow(c)}>
          Share my month
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close} accessibilityLabel="Close">
          <Text weight="bold" size={18} color={c.muted} style={{ lineHeight: 20 }}>
            ×
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + space.md }]}>
        <View style={styles.previewWrap}>
          <ShareCard
            ref={cardRef}
            palette={c}
            year={year}
            month={month}
            entries={entries}
            startedOn={startedOn}
            stats={stats}
            moments={shownMoments}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={16}>
                Hide all text
              </Text>
              <Text size={13} color={c.muted}>
                Just share your meadow and numbers
              </Text>
            </View>
            <Switch
              value={hideText}
              onValueChange={setHideText}
              trackColor={{ false: c.faint, true: c.cloverFill }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.faint}
            />
          </View>
        </View>

        {!hideText && (
          <View style={{ gap: space.xs }}>
            <Text weight="semibold" size={14} color={c.text} style={styles.label}>
              Choose up to {MAX_MOMENTS} moments · {chosen.length}/{MAX_MOMENTS}
            </Text>
            {stats.moments.length === 0 ? (
              <Text size={14} color={c.muted}>
                Nothing logged in {formatMonth(year, month)} yet.
              </Text>
            ) : (
              <View style={styles.card}>
                {stats.moments.map(({ day, item }, i) => {
                  const on = chosen.includes(item.id);
                  const full = !on && chosen.length >= MAX_MOMENTS;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(item.id)}
                      disabled={full}
                      style={[styles.row, i > 0 && styles.divided, full && { opacity: 0.4 }]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <Clover size={22} variant={item.extraLucky ? 'lucky' : 'filled'} />
                      <View style={{ flex: 1 }}>
                        <Text weight="bold" size={11} color={c.muted}>
                          {formatShortDate(day)}
                        </Text>
                        <Text weight="semibold" size={15} numberOfLines={2}>
                          {item.text}
                        </Text>
                      </View>
                      <View style={[styles.check, on && styles.checkOn]}>
                        {on && <CheckIcon color={c.onPrimary} size={14} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
        {/* At the end of the page, under the moments: it never covers anything. */}
        <Pressable
          onPress={onShare}
          disabled={sharing}
          style={({ pressed }) => [styles.share, (pressed || sharing) && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          {sharing ? <ActivityIndicator color={c.onPrimary} /> : <ShareIcon color={c.onPrimary} size={26} />}
        </Pressable>
      </ScrollView>

    </SafeAreaView>
  );
}

function useScreenStyles() {
  return useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.sm,
    },
    close: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
    // Fills the screen, so on a short page the share button rests at the bottom. Bottom padding
    // (set inline) keeps it clear of the home bar.
    content: { paddingHorizontal: space.lg, gap: space.md, flexGrow: 1 },
    previewWrap: {
      alignSelf: 'center',
      width: SHARE_WIDTH,
      height: SHARE_HEIGHT,
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.line,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: space.md,
      paddingVertical: space.xs,
      ...softShadow(c),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 10 },
    divided: { borderTopWidth: 1, borderTopColor: c.line },
    label: { paddingHorizontal: 4 },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: c.faint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: c.primary, borderColor: c.primary },
    // A wide pill share button, centred, on a soft grey shadow.
    share: {
      alignSelf: 'center',
      marginTop: 'auto',
      width: 132,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: c.dark ? 0.35 : 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
  }));
}
