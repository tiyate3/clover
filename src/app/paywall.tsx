import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clover } from '@/components/Clover';
import { CheckIcon } from '@/components/Icons';
import { Text } from '@/components/Text';
import { buyPlus, PURCHASES_SIMULATED, restorePlus, usePlusPrice } from '@/lib/purchases';
import { useStore } from '@/lib/store';
import { radius, softShadow, space, titleShadow, useStyles, useTheme } from '@/lib/theme';

type Feature = 'themes' | 'faceid' | 'widgets';

const FEATURES: { id: Feature; title: string; body: string }[] = [
  { id: 'themes', title: '5 extra themes', body: 'Forest, Golden hour, Blossom, Midnight and Autumn' },
  { id: 'faceid', title: 'Face ID lock', body: 'Keep your good moments private' },
  { id: 'widgets', title: 'Four Clover widgets', body: 'Streak, week strip, mini calendar and Lock Screen widgets' },
];

const notify = (title: string, message: string) =>
  Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

export default function PaywallScreen() {
  const { feature } = useLocalSearchParams<{ feature?: Feature }>();
  const { hasPlus, setHasPlus } = useStore();
  const c = useTheme();
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [justBought, setJustBought] = useState(false);
  const price = usePlusPrice();

  const styles = useStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: space.lg, gap: space.md, alignItems: 'center', paddingBottom: space.xl },
    close: {
      alignSelf: 'flex-end',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.dark ? '#38383C' : '#F0F0F2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    features: { alignSelf: 'stretch', gap: space.sm, marginTop: space.sm },
    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: c.line,
      padding: space.md,
      ...softShadow(c),
    },
    featureHighlight: { borderColor: c.gold },
    check: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.goldSoft, alignItems: 'center', justifyContent: 'center' },
    buy: {
      alignSelf: 'stretch',
      backgroundColor: c.primary,
      borderRadius: radius.pill,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: space.sm,
    },
    purchase: { alignSelf: 'stretch', alignItems: 'center', gap: 6 },
    link: { paddingVertical: 4 },
  }));

  const onBuy = async () => {
    setBusy('buy');
    try {
      const result = await buyPlus();
      // Cancelling is a choice, not an error, so it closes quietly.
      if (result.status === 'purchased') {
        await setHasPlus(true);
        setJustBought(true);
      } else if (result.status === 'pending') {
        notify('Purchase pending', 'Clover+ will unlock as soon as the purchase is approved.');
      } else if (result.status === 'unavailable') {
        notify('Not available yet', 'Purchases aren’t available in this version of Clover.');
      } else if (result.status === 'error') {
        notify('Purchase didn’t go through', result.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      const result = await restorePlus();
      if (result.status === 'restored') {
        await setHasPlus(true);
        setJustBought(true);
      } else if (result.status === 'error') {
        notify('Couldn’t restore', result.message);
      } else {
        notify('Nothing to restore', 'We couldn’t find a Clover+ purchase for this Apple ID.');
      }
    } finally {
      setBusy(null);
    }
  };

  const unlocked = hasPlus || justBought;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close} accessibilityLabel="Close">
          <Text weight="bold" size={18} color={c.dark ? '#AEAEB2' : '#6E6E73'} style={{ lineHeight: 20 }}>
            ×
          </Text>
        </Pressable>

        <Clover size={110} variant="lucky" />
        <Text weight="extrabold" size={30} style={titleShadow(c)}>
          {unlocked ? 'You have Clover+' : 'Clover+'}
        </Text>
        <Text size={16} color={c.muted} style={{ textAlign: 'center', lineHeight: 22 }}>
          {unlocked
            ? 'Everything is unlocked. Thank you for supporting Clover.'
            : 'One payment unlocks everything.\nNo subscription.'}
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.id} style={[styles.feature, feature === f.id && !unlocked && styles.featureHighlight]}>
              <View style={styles.check}>
                <CheckIcon color={c.goldStroke} size={16} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="bold" size={16}>
                  {f.title}
                </Text>
                <Text size={13} color={c.muted}>
                  {f.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {unlocked ? (
          <Pressable onPress={() => router.back()} style={styles.buy}>
            <Text weight="bold" size={17} color={c.onPrimary}>
              Done
            </Text>
          </Pressable>
        ) : (
          // Buy, the one-time note and Restore kept close together as one group.
          <View style={styles.purchase}>
            <Pressable
              onPress={onBuy}
              disabled={!!busy}
              style={({ pressed }) => [styles.buy, (pressed || !!busy) && { opacity: 0.8 }]}
            >
              {busy === 'buy' ? (
                <ActivityIndicator color={c.onPrimary} />
              ) : (
                <Text weight="bold" size={17} color={c.onPrimary}>
                  Unlock everything · {price}
                </Text>
              )}
            </Pressable>
            <Pressable onPress={onRestore} disabled={!!busy} hitSlop={8} style={styles.link}>
              {busy === 'restore' ? (
                <ActivityIndicator color={c.muted} />
              ) : (
                <Text weight="bold" size={15} color={c.text}>
                  Restore purchase
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {PURCHASES_SIMULATED && !unlocked && (
          <Text size={12} color={c.muted} style={{ textAlign: 'center' }}>
            Test mode: purchases are simulated and no money is taken.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
