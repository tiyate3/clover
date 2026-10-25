import { useRef, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, ScrollView, ScrollViewInstance, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedHeight } from '@/components/AnimatedHeight';
import { Clover, CloverVariant } from '@/components/Clover';
import { DayEntries } from '@/components/DayEntries';
import { FillingClover } from '@/components/FillingClover';
import { FormScrollView } from '@/components/FormScrollView';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { Text } from '@/components/Text';
import { useTabBarSpace } from '@/components/PillTabBar';
import { formatLongDate, fromKey, monthGrid, toKey, WEEKDAYS } from '@/lib/dates';
import { isLuckyDay, useStore } from '@/lib/store';
import { radius, softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';
import { useScrollToTopOnLeave } from '@/lib/useScrollToTopOnLeave';
import { useToday } from '@/lib/useToday';

export default function FieldScreen() {
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
  const [selected, setSelected] = useState<string | null>(null);

  const today = useToday();
  const cells = monthGrid(year, month);
  const selectedItems = selected ? entries[selected] : undefined;

  // With the keyboard up, a tap outside the sheet just puts it away; the next one closes the sheet.
  const onBackdropPress = () => (Keyboard.isVisible() ? Keyboard.dismiss() : setSelected(null));

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}>
        <Text weight="extrabold" size={28} style={titleShadow(c)}>
          Your meadow
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

        <View style={styles.card}>
          <View style={styles.row}>
            {WEEKDAYS.map((d, i) => (
              <View key={i} style={styles.cell}>
                <Text weight="bold" size={12} color={c.muted}>
                  {d}
                </Text>
              </View>
            ))}
          </View>
          {rows.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((day, col) => {
                if (day === null) return <View key={col} style={styles.cell} />;
                const key = toKey(new Date(year, month, day));
                const items = entries[key];
                // Future days can never be opened. Days before the app was first opened aren't part of the field.
                const outside = key > today || (key < startedOn && !items);
                const variant: CloverVariant = items ? (isLuckyDay(items) ? 'lucky' : 'filled') : 'faint';
                return (
                  <Pressable
                    key={col}
                    style={[styles.cell, key === today && styles.todayCell]}
                    disabled={outside}
                    onPress={() => setSelected(key)}
                    accessibilityLabel={`${formatLongDate(fromKey(key))}${
                      items ? `: ${items.map((i) => i.text).join(', ')}` : ''
                    }`}
                  >
                    {outside ? (
                      <View style={styles.blank} />
                    ) : (
                      <View>
                        <Clover size={variant === 'lucky' ? 24 : 22} variant={variant} />
                        {items && items.length > 1 && (
                          <View style={styles.badge}>
                            <Text weight="bold" size={9} color={c.dark ? c.background : '#FFFFFF'}>
                              {items.length}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <Text weight={key === today ? 'extrabold' : 'semibold'} size={11} color={outside ? c.faint : c.muted}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <LegendItem variant="filled" label="Logged" />
          <LegendItem variant="lucky" label="Extra lucky" />
          <LegendItem variant="faint" label="Missed" />
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        {/* Lifts the sheet in step with the keyboard on both platforms. */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <Pressable style={styles.backdrop} onPress={onBackdropPress} accessible={false}>
            <Pressable style={styles.sheet} onPress={Keyboard.dismiss} accessible={false}>
              {selected && (
                // Keeps the whole open form (text, Extra lucky, Save) visible as the sheet lifts and shrinks.
                <FormScrollView
                  liftedByParent
                  contentContainerStyle={styles.sheetContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                  <FillingClover
                    size={72}
                    filled={!!selectedItems?.length}
                    lucky={!!selectedItems && isLuckyDay(selectedItems)}
                  />
                  <Text weight="bold" size={15} color={c.muted} style={{ textAlign: 'center' }}>
                    {formatLongDate(fromKey(selected))}
                  </Text>
                  <View style={{ alignSelf: 'stretch' }}>
                    {/* The sheet eases to its new size as rows open into the editor and back. */}
                    <AnimatedHeight>
                      <DayEntries key={selected} day={selected} />
                    </AnimatedHeight>
                  </View>
                  <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
                    <Text weight="bold" size={15}>
                      Close
                    </Text>
                  </Pressable>
                </FormScrollView>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function LegendItem({ variant, label }: { variant: CloverVariant; label: string }) {
  const c = useTheme();
  const styles = useScreenStyles();
  return (
    <View style={styles.legendItem}>
      <Clover size={18} variant={variant} />
      <Text weight="semibold" size={12} color={c.muted}>
        {label}
      </Text>
    </View>
  );
}

function useScreenStyles() {
  return useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: space.lg, gap: space.md, paddingBottom: space.xl },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.line,
      ...softShadow(c),
      padding: space.sm,
      gap: 4,
    },
    row: { flexDirection: 'row' },
    cell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: radius.sm },
    todayCell: { backgroundColor: c.soft },
    blank: { width: 22, height: 22 },
    badge: {
      position: 'absolute',
      top: -7,
      right: -10,
      minWidth: 15,
      height: 15,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backdrop: { flex: 1, backgroundColor: 'rgba(20, 30, 22, 0.35)', justifyContent: 'flex-end', padding: space.md },
    sheet: { backgroundColor: c.sheet, borderRadius: radius.lg, maxHeight: '88%' },
    sheetContent: { padding: space.lg, alignItems: 'center', gap: space.sm },
    closeBtn: {
      marginTop: space.xs,
      backgroundColor: c.soft,
      borderRadius: radius.pill,
      paddingHorizontal: space.lg,
      paddingVertical: 12,
    },
  }));
}
