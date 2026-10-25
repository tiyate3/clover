import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

type Scrollable = { scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void };

/**
 * Scrolls a tab's page back to the top as you leave it, so coming back to the tab always starts
 * at the top. Done on the way out, so the jump is never seen.
 */
export function useScrollToTopOnLeave(ref: { current: Scrollable | null }) {
  useFocusEffect(
    useCallback(() => {
      return () => ref.current?.scrollTo({ y: 0, animated: false });
    }, [ref]),
  );
}
