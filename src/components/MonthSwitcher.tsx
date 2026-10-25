import { Pressable, View } from 'react-native';
import { formatMonth } from '@/lib/dates';
import { useStyles, useTheme } from '@/lib/theme';
import { ChevronIcon } from './Icons';
import { Text } from './Text';

type Props = {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  /** Earliest month the user can go back to. */
  minYear?: number;
  minMonth?: number;
};

export function MonthSwitcher({ year, month, onChange, minYear, minMonth }: Props) {
  const c = useTheme();
  const styles = useStyles((c) => ({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    btn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft },
  }));
  const now = new Date();
  const isCurrent = year === now.getFullYear() && month === now.getMonth();
  const isFirst =
    minYear !== undefined && minMonth !== undefined && year * 12 + month <= minYear * 12 + minMonth;

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onChange(d.getFullYear(), d.getMonth());
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => shift(-1)}
        disabled={isFirst}
        hitSlop={12}
        style={[styles.btn, isFirst && { opacity: 0.25 }]}
        accessibilityLabel="Previous month"
      >
        <ChevronIcon color={c.text} direction="left" />
      </Pressable>
      <Text weight="bold" size={18}>
        {formatMonth(year, month)}
      </Text>
      <Pressable
        onPress={() => shift(1)}
        disabled={isCurrent}
        hitSlop={12}
        style={[styles.btn, isCurrent && { opacity: 0.25 }]}
        accessibilityLabel="Next month"
      >
        <ChevronIcon color={c.text} />
      </Pressable>
    </View>
  );
}
