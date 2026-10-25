import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clover, GoldClover } from '@/components/Clover';
import { ShareIcon } from '@/components/Icons';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { Text } from '@/components/Text';
import { useTabBarSpace } from '@/components/PillTabBar';
import { formatLongDate, fromKey } from '@/lib/dates';
import { monthStats } from '@/lib/monthStats';
import { useStore } from '@/lib/store';
import { useScrollToTopOnLeave } from '@/lib/useScrollToTopOnLeave';
import { radius, softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';

export default function HighlightsScreen() {
  const c = useTheme();
  // Room at the end so the page scrolls clear of the floating tab bar.
  const tabBarSpace = useTabBarSpace();
  const scrollRef = useRef<ScrollViewInstance>(null);
  useScrollToTopOnLeave(scrollRef);
  const styles = useScreenStyles();
  const { entries, startedOn } = useStore();
  const start = fromKey(startedOn);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const stats = monthStats(entries, year, month);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}>
        <Text weight="extrabold" size={28} style={titleShadow(c)}>
          Highlights
        </Text>
        <MonthSwitcher
          year={year}
          month={month}
          minYear={start.getFullYear()}
          minMonth={start.getMonth()}
          onChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
        />

        {/* Big number */}
        <View style={styles.hero}>
          <Clover size={40} variant={stats.clovers === 0 ? 'faint' : 'filled'} />
          <Text weight="extrabold" size={64} style={{ lineHeight: 72 }}>
            {stats.clovers}
          </Text>
          <Text weight="semibold" size={17} color={c.muted}>
            {stats.clovers === 0
              ? 'You’re just getting started.'
              : stats.clovers === 1
                ? 'clover this month'
                : 'clovers this month'}
          </Text>
        </View>

        {/* Two stats */}
        <View style={styles.statRow}>
          <View style={styles.streakStat}>
            <View style={styles.statCopy}>
              <Text weight="extrabold" size={26} color={c.text} style={styles.statNumber}>
                {stats.bestStreak}
              </Text>
              <Text weight="bold" size={12} color={c.text} style={styles.statLabel}>
                Best streak
              </Text>
            </View>
          </View>
          <View style={styles.goldStat}>
            <View style={styles.statCopy}>
              <Text weight="extrabold" size={26} color={c.dark ? c.text : '#6F521E'} style={styles.statNumber}>
                {stats.goldClovers}
              </Text>
              <Text weight="bold" size={12} color={c.text} style={styles.statLabel}>
                Gold clovers
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Extra lucky moments */}
        <Text weight="extrabold" size={18}>
          Extra lucky moments
        </Text>
        {stats.goldDays.length === 0 ? (
          <Text size={14} color={c.muted}>
            No gold days this month yet.
          </Text>
        ) : (
          stats.goldDays.map(({ day, items }) => (
            <View key={day} style={styles.moment}>
              <GoldClover size={34} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text weight="bold" size={12} color={c.goldStroke}>
                  {formatLongDate(fromKey(day))}
                </Text>
                {items.map((item) => (
                  <Text key={item.id} weight="semibold" size={16}>
                    {item.text}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={() => router.push({ pathname: '/share', params: { year: String(year), month: String(month) } })}
          style={({ pressed }) => [styles.share, pressed && styles.sharePressed]}
        >
          <ShareIcon color={c.onPrimary} size={19} />
          <Text weight="bold" size={17} color={c.onPrimary}>
            Share my month
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function useScreenStyles() {
  return useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    // Fills the screen, so the share button can rest at the bottom when there's room.
    content: { padding: space.lg, gap: space.md, paddingBottom: space.lg, flexGrow: 1 },
    hero: { alignItems: 'center', paddingVertical: space.md },
    statRow: { flexDirection: 'row', gap: space.sm, marginHorizontal: -space.sm },
    streakStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      paddingVertical: space.sm,
      paddingHorizontal: space.sm,
      backgroundColor: c.dark ? '#302F2D' : '#F1F2F0',
      borderRadius: 24,
      ...softShadow(c),
      shadowOpacity: c.dark ? 0.24 : 0.09,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
    goldStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      paddingVertical: space.sm,
      paddingHorizontal: space.sm,
      backgroundColor: c.dark ? '#3A3425' : '#F5EEDB',
      borderRadius: 24,
      ...softShadow(c),
      shadowOpacity: c.dark ? 0.24 : 0.09,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: c.line,
      opacity: 0.65,
      marginTop: space.xs,
      marginBottom: space.xs,
    },
    statCopy: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
    statNumber: { fontWeight: '900', lineHeight: 32, textAlign: 'center' },
    statLabel: { textAlign: 'center' },
    moment: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      padding: space.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.line,
      ...softShadow(c),
    },
    share: {
      // Takes up any spare space above it: at the bottom of the screen until a long list of
      // gold days pushes it further down the page.
      marginTop: 'auto',
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      paddingVertical: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      // Lifts off the page on a soft grey shadow, with a faint lighter edge along the top.
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.18)',
      shadowColor: '#000000',
      shadowOpacity: c.dark ? 0.35 : 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    sharePressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  }));
}

