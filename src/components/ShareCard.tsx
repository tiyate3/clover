import { forwardRef } from 'react';
import { View, ViewInstance } from 'react-native';
import { formatShortDate, monthGrid, todayKey, toKey } from '@/lib/dates';
import { Moment, MonthStats } from '@/lib/monthStats';
import { Entries, isLuckyDay } from '@/lib/store';
import { Palette, softShadow } from '@/lib/theme';
import { Clover } from './Clover';
import { StreakIcon } from './Icons';
import { Text } from './Text';

/** Story-shaped (9:16) image of a month: the meadow of clovers, the numbers, and any chosen moments. */
export const SHARE_WIDTH = 300;
export const SHARE_HEIGHT = Math.round((SHARE_WIDTH * 16) / 9);

type Props = {
  palette: Palette;
  year: number;
  month: number;
  entries: Entries;
  startedOn: string;
  stats: MonthStats;
  /** Moments to print on the image; empty hides all entry text. */
  moments: Moment[];
};

export const ShareCard = forwardRef<ViewInstance, Props>(function ShareCard(
  { palette: c, year, month, entries, startedOn, stats, moments },
  ref,
) {
  const today = todayKey();
  const statsBox = c.dark ? c.surface : '#F3F4F3';
  const cells = monthGrid(year, month);
  const cellSize = (SHARE_WIDTH - 40) / 7;
  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long' });

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: SHARE_WIDTH,
        height: SHARE_HEIGHT,
        backgroundColor: c.background,
        paddingHorizontal: 20,
        paddingVertical: 26,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Clover size={18} variant="filled" palette={c} />
          <Text weight="bold" size={12} color={c.muted}>
            Clover
          </Text>
        </View>
        <Text weight="extrabold" size={30} color={c.text}>
          {monthName}
        </Text>
        <Text weight="semibold" size={13} color={c.muted}>
          {year} · my month of good things
        </Text>
      </View>

      {/* The meadow */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={{ width: cellSize, height: cellSize }} />;
          const key = toKey(new Date(year, month, day));
          const items = entries[key];
          const outside = key > today || (key < startedOn && !items);
          return (
            <View key={i} style={{ width: cellSize, height: cellSize, alignItems: 'center', justifyContent: 'center' }}>
              {outside ? (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.faint }} />
              ) : (
                <Clover
                  size={cellSize * 0.82}
                  variant={items ? (isLuckyDay(items) ? 'lucky' : 'filled') : 'faint'}
                  palette={c}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* The numbers */}
      <View
        style={{
          flexDirection: 'row',
          // A light grey with a soft shadow, so the numbers stand out from the card.
          backgroundColor: statsBox,
          borderRadius: 18,
          ...softShadow(c),
          paddingVertical: 8,
        }}
      >
        <Stat palette={c} value={stats.clovers} label={stats.clovers === 1 ? 'CLOVER' : 'CLOVERS'} icon={<Clover size={20} variant="filled" palette={c} />} />
        <Stat palette={c} value={stats.goldClovers} label="GOLD CLOVERS" icon={<Clover size={20} variant="lucky" palette={c} />} />
        <Stat palette={c} value={stats.bestStreak} label="BEST STREAK" icon={<StreakIcon size={25} color="#858585" innerColor={statsBox} />} />
      </View>

      {/* Chosen moments (optional) */}
      <View style={{ gap: 8, minHeight: moments.length ? undefined : 0 }}>
        {moments.map(({ day, item }) => (
          <View key={item.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ paddingTop: 2 }}>
              <Clover size={16} variant={item.extraLucky ? 'lucky' : 'filled'} palette={c} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="bold" size={10} color={c.muted}>
                {formatShortDate(day)}
              </Text>
              <Text weight="semibold" size={13} color={c.text} numberOfLines={2}>
                {item.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <Text weight="semibold" size={11} color={c.muted}>
          You are luckier than you think
        </Text>
        <Text weight="semibold" size={11} color={c.muted}>
          {'\u00B7'}
        </Text>
        <Text weight="semibold" size={11} color={c.muted}>
          Clover
        </Text>
      </View>
    </View>
  );
});

function Stat({ palette: c, value, label, icon }: { palette: Palette; value: number; label: string; icon: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 1 }}>
      <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <View
          style={{
            width: 30,
            height: 30,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#26352A',
            shadowOpacity: c.dark ? 0.16 : 0.1,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}
        >
          {icon}
        </View>
        <Text weight="extrabold" size={17} color={c.text} style={{ lineHeight: 20 }}>
          {value}
        </Text>
      </View>
      <Text weight="semibold" size={9} color={c.muted}>
        {label}
      </Text>
    </View>
  );
}
