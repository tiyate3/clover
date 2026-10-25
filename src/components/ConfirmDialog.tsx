import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, softShadow, space, useStyles } from '@/lib/theme';
import { Text } from './Text';

type Props = {
  visible: boolean;
  /** Shown first, in quotes: the thing about to be deleted. */
  quote?: string;
  title: string;
  message?: string;
  /** Small italic line under everything else. */
  note?: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** An "are you sure?" card near the bottom of the screen for destructive actions: red confirm, grey Cancel. */
export function ConfirmDialog({ visible, quote, title, message, note, confirmLabel, onCancel, onConfirm }: Props) {
  const styles = useConfirmStyles();
  // Sits above the home indicator with a clear gap, not flush against the bottom edge.
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { paddingBottom: bottom + space.md }]} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          {quote !== undefined && (
            <Text weight="semibold" size={17} style={[styles.center, styles.quote]} numberOfLines={3}>
              &quot;{quote}&quot;
            </Text>
          )}
          <Text weight="bold" size={quote !== undefined ? 16 : 19} style={styles.center}>
            {title}
          </Text>
          {message && (
            <Text size={15} style={[styles.center, styles.message, styles.muted]}>
              {message}
            </Text>
          )}
          {note && (
            <Text size={12} style={[styles.center, styles.note, styles.muted]}>
              {note}
            </Text>
          )}
          {/* Stacked like iOS confirmations: the action on top, Cancel underneath. */}
          <View style={styles.actions}>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirm, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text weight="semibold" size={16} color="#FFFFFF" style={styles.label}>
                {confirmLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text weight="semibold" size={16} style={styles.label}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function useConfirmStyles() {
  return useStyles((c) => ({
    backdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: space.lg, backgroundColor: 'rgba(24, 34, 27, 0.34)' },
    card: { width: '100%', maxWidth: 360, alignItems: 'center', gap: space.sm, padding: space.lg, backgroundColor: c.sheet, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, ...softShadow(c) },
    center: { textAlign: 'center' },
    muted: { color: c.muted },
    message: { lineHeight: 21 },
    // Black (white on dark themes), so the entry being deleted reads first.
    quote: { color: c.dark ? '#FFFFFF' : '#000000' },
    // Tucked up under the line above it rather than a full gap away.
    note: { fontStyle: 'italic', marginTop: -space.xs },
    // Reaches a little past the text, so the buttons are wide and easy to hit.
    actions: { alignSelf: 'stretch', gap: 10, marginTop: space.sm, marginHorizontal: -space.xs },
    // Only slightly rounded.
    button: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    label: { letterSpacing: 0.2 },
    confirm: {
      backgroundColor: c.dark ? '#C9584C' : '#C2453A',
      shadowColor: '#7A1F17',
      shadowOpacity: c.dark ? 0 : 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
    // A very light grey fill with a darker grey outline.
    cancel: { backgroundColor: c.dark ? '#38383C' : '#F7F8F7', borderWidth: 1, borderColor: c.dark ? '#5E5E63' : '#C4C7C4' },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  }));
}
