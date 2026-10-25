import { HStack, Image, Rectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  kerning,
  offset,
  opacity,
  rotationEffect,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

/* eslint-disable react-hooks/static-components -- widget functions are serialized and run outside
   React, so helpers must be declared inside each one (see below); nothing here re-renders. */

/*
 * Each 'widget' function is compiled into its own string and run in an isolated runtime inside
 * the widget extension. Nothing declared outside the function exists there, so every helper
 * (the clover mark, the Clover+ lock) is declared inside each widget that uses it.
 *
 * Two rules from how iOS hosts them:
 * - Props are saved in UserDefaults, which can't hold `null`, so props never contain null.
 * - iOS also draws widgets with empty props (gallery previews, before the app has synced),
 *   so every widget falls back to safe defaults instead of reading missing fields.
 */

export type WidgetPalette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  cloverFill: string;
  cloverStroke: string;
  gold: string;
};

export type PaidWidgetProps = WidgetPalette & { locked: boolean };
export type WeekDay = { key: string; label: string; day: string; logged: boolean; lucky: boolean };
/** `day` is 0 for the blank cells before the 1st and after the last day. */
export type CalendarCell = { day: number; logged: boolean; lucky: boolean; future: boolean; today: boolean };

export type StreakProps = PaidWidgetProps & { streak: number };
export type WeekStripProps = PaidWidgetProps & { days: WeekDay[]; todayLogged: boolean };
export type MiniCalendarProps = PaidWidgetProps & { month: string; weekdays: string[]; cells: CalendarCell[] };
export type LockScreenProps = PaidWidgetProps & { streak: number };

function StreakView(props: StreakProps) {
  'widget';
  const CloverMark = ({ size, color, filled = true }: { size: number; color: string; filled?: boolean }) => {
    const symbol = filled ? 'heart.fill' : 'heart';
    const leaf = size * 0.52;
    return (
      <ZStack modifiers={[frame({ width: size, height: size })]}>
        <Image systemName={symbol} size={leaf} color={color} modifiers={[offset({ y: -size * 0.19 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(-120), offset({ x: -size * 0.19, y: size * 0.1 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(120), offset({ x: size * 0.19, y: size * 0.1 })]} />
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1, size * 0.07), height: size * 0.25 }),
            foregroundStyle(color),
            rotationEffect(35),
            offset({ x: size * 0.14, y: size * 0.34 }),
          ]}
        />
      </ZStack>
    );
  };

  if (props.locked) {
    return (
      <VStack
        alignment="center"
        spacing={5}
        modifiers={[containerBackground(props.background, 'widget'), widgetURL('clover:///paywall?feature=widgets')]}
      >
        <CloverMark size={25} color={props.gold} />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(props.text)]}>Clover+</Text>
      </VStack>
    );
  }

  // Calm and typographic: a quiet label and one big rounded number on the app's soft white.
  const streak = props.streak ?? 0;
  const caption = streak === 0 ? 'Add a moment to begin' : streak === 1 ? 'day so far' : 'days in a row';
  const background = containerBackground(props.background ?? '#FCFCFC', 'widget');

  return (
    <HStack alignment="top" spacing={0} modifiers={[background, widgetURL('clover:///')]}>
      <VStack alignment="leading" spacing={0}>
        <Text modifiers={[font({ size: 11, weight: 'semibold', design: 'rounded' }), kerning(1.4), foregroundStyle(props.muted)]}>STREAK</Text>
        <Spacer />
        <Text modifiers={[font({ size: 58, weight: 'semibold', design: 'rounded' }), foregroundStyle(props.text)]}>{String(streak)}</Text>
        <Text modifiers={[font({ size: 13, weight: 'medium', design: 'rounded' }), foregroundStyle(props.muted)]}>{caption}</Text>
      </VStack>
      <Spacer />
    </HStack>
  );
}

function WeekStripView(props: WeekStripProps) {
  'widget';
  // The app's gold four-leaf: leaves on the diagonals, the whole mark tilted 14° left, stem below.
  const LuckyMark = ({ size, color }: { size: number; color: string }) => {
    const reach = size * 0.21;
    return (
      <ZStack modifiers={[frame({ width: size, height: size })]}>
        {[31, 121, 211, 301].map((angle) => (
          <Image
            key={angle}
            systemName="heart.fill"
            size={size * 0.4}
            color={color}
            modifiers={[
              rotationEffect(angle),
              offset({ x: Math.sin((angle * Math.PI) / 180) * reach, y: -Math.cos((angle * Math.PI) / 180) * reach }),
            ]}
          />
        ))}
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1, size * 0.05), height: size * 0.22 }),
            foregroundStyle(color),
            rotationEffect(-20),
            offset({ x: size * 0.08, y: size * 0.38 }),
          ]}
        />
      </ZStack>
    );
  };
  const CloverMark = ({ size, color, filled = true }: { size: number; color: string; filled?: boolean }) => {
    const symbol = filled ? 'heart.fill' : 'heart';
    const leaf = size * 0.52;
    return (
      <ZStack modifiers={[frame({ width: size, height: size })]}>
        <Image systemName={symbol} size={leaf} color={color} modifiers={[offset({ y: -size * 0.19 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(-120), offset({ x: -size * 0.19, y: size * 0.1 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(120), offset({ x: size * 0.19, y: size * 0.1 })]} />
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1, size * 0.07), height: size * 0.25 }),
            foregroundStyle(color),
            rotationEffect(35),
            offset({ x: size * 0.14, y: size * 0.34 }),
          ]}
        />
      </ZStack>
    );
  };

  if (props.locked) {
    return (
      <VStack
        alignment="center"
        spacing={5}
        modifiers={[containerBackground(props.background, 'widget'), widgetURL('clover:///paywall?feature=widgets')]}
      >
        <CloverMark size={25} color={props.gold} />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(props.text)]}>Clover+</Text>
      </VStack>
    );
  }

  const days = props.days ?? [];
  return (
    <VStack alignment="leading" spacing={7} modifiers={[containerBackground(props.background, 'widget'), widgetURL('clover:///field')]}>
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(props.text)]}>Your week</Text>
      <HStack alignment="center" spacing={2}>
        {days.map((day) => (
          <VStack key={day.key} alignment="center" spacing={2} modifiers={[frame({ maxWidth: 44 })]}>
            <Text modifiers={[font({ size: 9, weight: 'medium' }), foregroundStyle(props.muted)]}>{day.label}</Text>
            {day.lucky ? (
              <LuckyMark size={36} color={props.gold} />
            ) : (
              <CloverMark size={36} color={day.logged ? props.cloverFill : props.cloverStroke} filled={day.logged} />
            )}
            <Text modifiers={[font({ size: 9 }), foregroundStyle(props.muted)]}>{day.day}</Text>
          </VStack>
        ))}
      </HStack>
      <Text modifiers={[font({ size: 10, weight: 'medium' }), foregroundStyle(props.todayLogged ? props.cloverFill : props.muted)]}>
        {props.todayLogged ? 'Another moment added to your collection' : 'Add something from today…'}
      </Text>
    </VStack>
  );
}

function MiniCalendarView(props: MiniCalendarProps) {
  'widget';
  const cellSize = 42;
  const CloverMark = ({ size, color, filled = true }: { size: number; color: string; filled?: boolean }) => {
    const symbol = filled ? 'heart.fill' : 'heart';
    const leaf = size * 0.52;
    return (
      <ZStack modifiers={[frame({ width: size, height: size })]}>
        <Image systemName={symbol} size={leaf} color={color} modifiers={[offset({ y: -size * 0.19 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(-120), offset({ x: -size * 0.19, y: size * 0.1 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(120), offset({ x: size * 0.19, y: size * 0.1 })]} />
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1, size * 0.07), height: size * 0.25 }),
            foregroundStyle(color),
            rotationEffect(35),
            offset({ x: size * 0.14, y: size * 0.34 }),
          ]}
        />
      </ZStack>
    );
  };

  if (props.locked) {
    return (
      <VStack
        alignment="center"
        spacing={5}
        modifiers={[containerBackground(props.background, 'widget'), widgetURL('clover:///paywall?feature=widgets')]}
      >
        <CloverMark size={25} color={props.gold} />
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(props.text)]}>Clover+</Text>
      </VStack>
    );
  }

  // Each day is one clover symbol and its number. The large widget draws a whole month, and iOS
  // gives widgets little memory and time: a heavier per-day drawing made it fall back to the
  // last thing it could draw (the locked tile), even with Clover+.
  const cells = props.cells ?? [];
  const weekdays = props.weekdays ?? [];
  const weeks = [];
  for (let start = 0; start < cells.length; start += 7) {
    weeks.push(
      <HStack key={`week-${start}`} alignment="center" spacing={2}>
        {cells.slice(start, start + 7).map((cell, index) =>
          cell.day ? (
            <VStack key={`cell-${start + index}`} alignment="center" spacing={2} modifiers={[frame({ width: cellSize, height: cellSize })]}>
              <Image
                systemName="suit.club.fill"
                size={21}
                color={cell.lucky ? props.gold : cell.logged ? props.cloverFill : props.cloverStroke}
                modifiers={[opacity(cell.logged ? 1 : cell.future ? 0.08 : 0.18)]}
              />
              <Text
                modifiers={[
                  font({ size: 10, weight: cell.today ? 'bold' : 'medium', design: 'rounded' }),
                  foregroundStyle(cell.today ? props.text : props.muted),
                ]}
              >
                {String(cell.day)}
              </Text>
            </VStack>
          ) : (
            <Text key={`cell-${start + index}`} modifiers={[frame({ width: cellSize, height: cellSize })]}> </Text>
          ),
        )}
      </HStack>,
    );
  }

  return (
    <VStack alignment="leading" spacing={7} modifiers={[containerBackground(props.background, 'widget'), widgetURL('clover:///field')]}>
      <Text modifiers={[font({ size: 17, weight: 'bold', design: 'rounded' }), foregroundStyle(props.text)]}>{props.month ?? ''}</Text>
      <HStack alignment="center" spacing={2}>
        {weekdays.map((day, i) => (
          <Text key={`weekday-${i}`} modifiers={[frame({ width: cellSize }), font({ size: 10, weight: 'semibold' }), foregroundStyle(props.muted)]}>
            {day}
          </Text>
        ))}
      </HStack>
      <VStack alignment="center" spacing={3}>
        {weeks}
      </VStack>
    </VStack>
  );
}

function LockScreenView(props: LockScreenProps, environment: WidgetEnvironment) {
  'widget';
  const CloverMark = ({ size, color }: { size: number; color: string }) => {
    const leaf = size * 0.52;
    return (
      <ZStack modifiers={[frame({ width: size, height: size })]}>
        <Image systemName="heart.fill" size={leaf} color={color} modifiers={[offset({ y: -size * 0.19 })]} />
        <Image systemName="heart.fill" size={leaf} color={color} modifiers={[rotationEffect(-120), offset({ x: -size * 0.19, y: size * 0.1 })]} />
        <Image systemName="heart.fill" size={leaf} color={color} modifiers={[rotationEffect(120), offset({ x: size * 0.19, y: size * 0.1 })]} />
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1, size * 0.07), height: size * 0.25 }),
            foregroundStyle(color),
            rotationEffect(35),
            offset({ x: size * 0.14, y: size * 0.34 }),
          ]}
        />
      </ZStack>
    );
  };

  // Lock Screen widgets are tinted by the system, so draw in one colour on a clear background.
  // iOS 17+ shows a placeholder for any widget without a container background.
  const color = environment.widgetRenderingMode === 'fullColor' ? props.cloverFill : '#FFFFFF';
  const background = containerBackground('clear', 'widget');

  if (props.locked) {
    return (
      <VStack alignment="center" spacing={1} modifiers={[background, widgetURL('clover:///paywall?feature=widgets')]}>
        <CloverMark size={18} color={color} />
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(color)]}>Clover+</Text>
      </VStack>
    );
  }

  if (environment.widgetFamily === 'accessoryRectangular') {
    return (
      <HStack alignment="center" spacing={6} modifiers={[background, widgetURL('clover:///')]}>
        <CloverMark size={19} color={color} />
        <VStack alignment="leading" spacing={1}>
          <Text modifiers={[font({ size: 10, weight: 'medium' }), foregroundStyle(color)]}>STREAK</Text>
          <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(color)]}>
            {props.streak === 1 ? '1 day' : `${props.streak ?? 0} days`}
          </Text>
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack alignment="center" spacing={1} modifiers={[background, widgetURL('clover:///')]}>
      <CloverMark size={18} color={color} />
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(color)]}>{String(props.streak ?? 0)}</Text>
    </VStack>
  );
}

export const CloverStreakWidget = createWidget('CloverStreakWidget', StreakView);
export const CloverWeekStripWidget = createWidget('CloverWeekStripWidget', WeekStripView);
export const CloverMiniCalendarWidget = createWidget('CloverMiniCalendarWidget', MiniCalendarView);
export const CloverLockScreenWidget = createWidget('CloverLockScreenWidget', LockScreenView);
