import { Image, Rectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  multilineTextAlignment,
  offset,
  opacity,
  rotationEffect,
  shadow,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget } from 'expo-widgets';

export type TodayCloverWidgetProps = {
  logged: boolean;
  /** Good things saved today, capped at 3 (one clover each). */
  count: number;
  /** Any Extra lucky entry today: the whole widget turns gold. */
  lucky: boolean;
  background: string;
  text: string;
  muted: string;
  cloverFill: string;
  cloverStroke: string;
  gold: string;
  goldStroke: string;
};

/*
 * Runs in the widget's isolated runtime: everything it uses is declared inside the function,
 * props never contain null, and empty props (gallery previews) fall back to an unlogged day.
 */
function TodayCloverWidgetView(props: TodayCloverWidgetProps) {
  'widget';
  const Clover = ({ size, color, angle, x, y, fade }: { size: number; color: string; angle: number; x: number; y: number; fade: number }) => {
    const symbol = 'heart.fill';
    const leaf = size * 0.57;
    return (
      <ZStack modifiers={[frame({ width: size, height: size }), rotationEffect(angle), offset({ x, y }), opacity(fade)]}>
        <Image systemName={symbol} size={leaf} color={color} modifiers={[offset({ y: -size * 0.15 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(-120), offset({ x: -size * 0.2, y: size * 0.12 })]} />
        <Image systemName={symbol} size={leaf} color={color} modifiers={[rotationEffect(120), offset({ x: size * 0.2, y: size * 0.12 })]} />
        <Rectangle
          modifiers={[
            frame({ width: Math.max(1.5, size * 0.05), height: size * 0.24 }),
            foregroundStyle(color),
            rotationEffect(35),
            offset({ x: size * 0.15, y: size * 0.39 }),
          ]}
        />
      </ZStack>
    );
  };

  const logged = !!props.logged;
  const count = Math.max(1, Math.min(3, props.count ?? 1));
  const lucky = logged && !!props.lucky;
  const gold = props.gold ?? '#D4A84B';
  const goldDeep = props.goldStroke ?? '#B48A33';

  // A gold day glows: warm gradient, cream clovers. Otherwise the app's soft white and sage.
  const background = lucky
    ? containerBackground({ type: 'linearGradient', colors: [gold, goldDeep], startPoint: { x: 0, y: 0 }, endPoint: { x: 1, y: 1 } }, 'widget')
    : containerBackground(props.background ?? '#FCFCFC', 'widget');
  const titleColor = lucky ? '#FFFDF6' : props.text ?? '#2F5D3A';
  const messageColor = lucky ? '#FFF6E0' : props.muted ?? '#8C9A8E';
  // Before anything is saved, the same clover sits pale and waiting; saving fills it with colour.
  const cloverColor = lucky ? '#FFFDF6' : props.cloverFill ?? '#7FA37A';
  const emptyFade = 0.22;
  const depth = shadow({ radius: 6, y: 2, color: lucky ? '#7A5A1A40' : '#2F5D3A1F' });

  // Up to three clovers, gently fanned and overlapping like a small posy; the front one is fullest.
  const fans = [
    [{ angle: -8, x: 0, y: 0, size: 62, fade: 1 }],
    [
      { angle: -18, x: -15, y: 2, size: 52, fade: 0.6 },
      { angle: 10, x: 12, y: -1, size: 56, fade: 1 },
    ],
    [
      { angle: -22, x: -22, y: 4, size: 46, fade: 0.5 },
      { angle: 18, x: 22, y: 3, size: 46, fade: 0.5 },
      { angle: -4, x: 0, y: -3, size: 56, fade: 1 },
    ],
  ];
  const layouts = fans[(logged ? count : 1) - 1] ?? fans[0];

  return (
    <VStack alignment="center" spacing={6} modifiers={[background, widgetURL('clover:///')]}> 
      <Text modifiers={[font({ size: 13, weight: 'semibold', design: 'rounded' }), foregroundStyle(titleColor)]}>Today</Text>
      <ZStack modifiers={[frame({ width: 110, height: 64 }), depth]}>
        {layouts.map((c, i) => (
          <Clover key={`clover-${i}`} size={c.size} color={cloverColor} angle={c.angle} x={c.x} y={c.y} fade={logged ? c.fade : emptyFade} />
        ))}
      </ZStack>
      <Text
        modifiers={[
          font({ size: 11, weight: 'medium', design: 'rounded' }),
          foregroundStyle(messageColor),
          multilineTextAlignment('center'),
          // Always two lines tall, whichever message shows, so saving never shifts the clover or title.
          lineLimit(2, { reservesSpace: true }),
        ]}
      >
        {logged ? 'Keep noticing the little things' : 'Find a small win'}
      </Text>
    </VStack>
  );
}

export const TodayCloverWidget = createWidget('TodayCloverWidget', TodayCloverWidgetView);
