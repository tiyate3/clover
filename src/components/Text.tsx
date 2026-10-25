import { Text as RNText, TextProps } from 'react-native';
import { fontWeights, useTheme } from '@/lib/theme';

type Weight = keyof typeof fontWeights;

type Props = TextProps & { weight?: Weight; size?: number; color?: string };

export function Text({ weight = 'regular', size = 16, color, style, ...rest }: Props) {
  const c = useTheme();
  return (
    <RNText {...rest} style={[{ fontWeight: fontWeights[weight], fontSize: size, color: color ?? c.text }, style]} />
  );
}
