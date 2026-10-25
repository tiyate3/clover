import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import { setInputBlocked } from '@/lib/interactive';
import { useStore } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';
import { Clover } from './Clover';
import { Text } from './Text';

/**
 * Covers the app until Face ID succeeds, when the Face ID lock (Clover+) is on.
 * Locks again whenever the app goes to the background.
 */
export function AppLock() {
  const { settings, hasPlus } = useStore();
  const c = useTheme();
  const enabled = settings.faceIdLock && hasPlus && Platform.OS !== 'web';
  const [locked, setLockedState] = useState(enabled);
  const lockedRef = useRef(enabled);
  const busy = useRef(false);

  const setLocked = useCallback((value: boolean) => {
    lockedRef.current = value;
    setLockedState(value);
  }, []);

  // No keyboard over the lock screen; a pending focus waits until Face ID succeeds.
  useEffect(() => {
    setInputBlocked('lock', enabled && locked);
  }, [enabled, locked]);

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Clover' });
      if (result.success) setLocked(false);
    } finally {
      busy.current = false;
    }
  }, [setLocked]);

  // Prompt straight away when opened locked.
  useEffect(() => {
    if (enabled && locked) unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      // The Face ID sheet itself makes the app "inactive", so only lock on a real trip to the background.
      if (state === 'background') setLocked(true);
      if (state === 'active' && lockedRef.current) unlock();
    });
    return () => sub.remove();
  }, [enabled, unlock, setLocked]);

  if (!enabled || !locked) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: c.background }]}>
      <Clover size={120} variant="filled" />
      <Text weight="extrabold" size={24}>
        Clover is locked
      </Text>
      <Pressable onPress={unlock} style={[styles.button, { backgroundColor: c.primary }]}>
        <Text weight="bold" size={17} color={c.onPrimary}>
          Unlock with Face ID
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: space.md, zIndex: 100 },
  button: { marginTop: space.sm, borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: space.xl },
});
