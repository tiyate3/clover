import { View } from 'react-native';
import { useStore } from '@/lib/store';
import { radius, useTheme } from '@/lib/theme';
import { LockIcon } from './Icons';
import { Text } from './Text';

/** Marks a feature included with Clover+. */
export function PlanBadge() {
  const c = useTheme();
  const { hasPlus } = useStore();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: c.goldSoft,
        borderRadius: radius.pill,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      {!hasPlus && <LockIcon color={c.goldStroke} size={11} />}
      <Text weight="bold" size={11} color={c.goldStroke}>
        CLOVER+
      </Text>
    </View>
  );
}
