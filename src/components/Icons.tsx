import { ColorValue } from 'react-native';
import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type P = { color: ColorValue; size?: number };

export function TodayIcon({ color, size = 24 }: P) {
  const leaf = 'M12 12 C 7.5 9.5, 5.5 5.5, 8.6 3.6 C 10.4 2.6, 12 4, 12 5.6 C 12 4, 13.6 2.6, 15.4 3.6 C 18.5 5.5, 16.5 9.5, 12 12 Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[0, 120, 240].map((a) => (
        <Path key={a} d={leaf} stroke={color} strokeWidth="1.7" strokeLinejoin="round" transform={`rotate(${a} 12 12)`} />
      ))}
    </Svg>
  );
}

export function FieldIcon({ color, size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4.5" width="17" height="16" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="9" cy="14.5" r="1.2" fill={color} />
      <Circle cx="15" cy="14.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function HighlightsIcon({ color, size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 19.2h15M7 17v-4M12 17V9.5M17 17V6.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon({ color, size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Path key={a} d="M12 3.2v2.6" stroke={color} strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${a} 12 12)`} />
      ))}
      <Circle cx="12" cy="12" r="6.4" stroke={color} strokeWidth="1.9" fill="none" />
      <Circle cx="12" cy="12" r="2.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ChevronIcon({ color, size = 22, direction = 'right' }: P & { direction?: 'left' | 'right' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === 'right' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LockIcon({ color, size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4.5" y="10.5" width="15" height="10.5" rx="3" fill={color} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ color, size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The gold flame used wherever a streak is shown. */
export function StreakIcon({ size = 24, color, innerColor }: { size?: number; color?: string; innerColor?: string }) {
  const gradient = `streak${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DDB367" />
          <Stop offset="1" stopColor="#BE9244" />
        </LinearGradient>
      </Defs>
      <Path
        d="M48 10 C 54 24, 72 34, 72 58 C 72 74, 61 86, 48 86 C 35 86, 24 74, 24 58 C 24 46, 30 38, 36 32 C 37 40, 40 45, 45 47 C 43 34, 44 22, 48 10 Z"
        fill={color ?? `url(#${gradient})`}
      />
      <Path d="M48 52 C 51 58, 58 62, 58 70 C 58 76, 53.5 80, 48 80 C 42.5 80, 38 76, 38 70 C 38 64, 44 60, 48 52 Z" fill={innerColor ?? '#EDD394'} />
    </Svg>
  );
}

/** An understated four-leaf outline for gold clovers. */
/** The iOS share symbol: a box with an arrow leaving the top. */
export function ShareIcon({ color, size = 20 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5v11M8 7.2l4-3.7 4 3.7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

