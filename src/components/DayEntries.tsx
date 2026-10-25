import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, TextInputInstance, View } from 'react-native';
import Animated, { LayoutAnimationConfig, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { todayKey } from '@/lib/dates';
import { whenReadyForInput } from '@/lib/interactive';
import { fadeTiming, useEntryMotion } from '@/lib/motion';
import { Item, useStore } from '@/lib/store';
import { radius, softShadow, space, useStyles, useTheme } from '@/lib/theme';
import { Clover } from './Clover';
import { ConfirmDialog } from './ConfirmDialog';
import { EntryForm } from './EntryForm';
import { Text } from './Text';

type Props = {
  /** Day key (YYYY-MM-DD). Future days are never editable. */
  day: string;
  /** Open the "What went right?" form straight away when the day is empty (Today does this). */
  openWhenEmpty?: boolean;
  /** Open the input when Today was opened from the Home Screen widget. */
  openInput?: boolean;
  /** Clear the widget's one-shot input deep link after closing the form. */
  onCloseInput?: () => void;
  /** Called after an item is added or changed (Today uses it for the review prompt). */
  onSaved?: (added: boolean, loggedDays?: number) => void;
};

/** The list of a day's good things, with add, edit (in place) and remove. */
export function DayEntries({ day, openWhenEmpty = false, openInput = false, onCloseInput, onSaved }: Props) {
  const { entries, addItem, updateItem, removeItem } = useStore();
  const c = useTheme();
  const styles = useDayStyles();
  const motion = useEntryMotion();
  const items = entries[day] ?? [];
  const hasItems = items.length > 0;
  const future = day > todayKey();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Item | null>(null);
  const addInputRef = useRef<TextInputInstance>(null);

  // Opened from the widget while the form was already showing: focus once the screen is ready,
  // so the scroll view can lift the form above the keyboard. (A freshly opened form focuses itself.)
  useEffect(() => {
    if (!openInput) return;
    let active = true;
    void whenReadyForInput().then(() => active && addInputRef.current?.focus());
    return () => {
      active = false;
    };
  }, [openInput]);

  if (future) {
    return (
      <Text size={15} color={c.muted} style={styles.center}>
        This day hasn&apos;t happened yet.
      </Text>
    );
  }

  const showAddForm = !editingId && ((openWhenEmpty && !hasItems) || formOpen || openInput);
  const isToday = day === todayKey();

  const closeForms = () => {
    Keyboard.dismiss();
    setEditingId(null);
    setFormOpen(false);
    onCloseInput?.();
  };

  // The store updates synchronously, so closing the form in the same tick swaps form for entry in one frame.
  const onAdd = async (text: string, extraLucky: boolean) => {
    const saved = addItem(day, text, extraLucky);
    closeForms();
    onSaved?.(true, await saved);
  };

  const onEdit = async (item: Item, text: string, extraLucky: boolean) => {
    const saved = updateItem(day, item.id, text, extraLucky);
    closeForms();
    await saved;
    onSaved?.(false);
  };

  const startEdit = (item: Item) => {
    setFormOpen(false);
    setEditingId(item.id);
  };

  const confirmDelete = (item: Item) => {
    setDeleteCandidate(item);
  };

  const removeConfirmed = () => {
    if (!deleteCandidate) return;
    if (editingId === deleteCandidate.id) closeForms();
    removeItem(day, deleteCandidate.id);
    setDeleteCandidate(null);
  };

  const question = hasItems ? 'Anything else go right?' : isToday ? 'What went right today?' : 'What went right that day?';

  return (
    // Rows already on screen appear as they are; only new or just-saved ones settle in.
    <LayoutAnimationConfig skipEntering>
      <>
      <View style={{ gap: space.md }}>
        {hasItems && (
          <View style={{ gap: space.sm }}>
            {items.map((item) =>
              editingId === item.id ? (
                <Animated.View key={`edit-${item.id}`} entering={motion.fadeIn}>
                  <EntryForm
                    initialText={item.text}
                    initialLucky={item.extraLucky}
                    submitLabel="Save changes"
                    autoFocus
                    onSave={(text, lucky) => onEdit(item, text, lucky)}
                    onCancel={closeForms}
                  />
                </Animated.View>
              ) : (
                <Animated.View key={item.id} entering={motion.settle} exiting={motion.fadeOut} layout={motion.layout}>
                  <Pressable
                    onPress={() => startEdit(item)}
                    style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.85 }]}
                    accessibilityHint="Tap to edit"
                  >
                    <Clover size={26} variant={item.extraLucky ? 'lucky' : 'filled'} />
                    <Text weight="semibold" size={16} style={{ flex: 1 }}>
                      {item.text}
                    </Text>
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={10} style={styles.removeBtn} accessibilityLabel="Remove">
                      <Text weight="bold" size={16} color={c.muted} style={{ lineHeight: 18 }}>
                        ×
                      </Text>
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ),
            )}
          </View>
        )}

        {showAddForm ? (
          <Animated.View key="add-form" entering={motion.fadeIn}>
            <EntryForm
              title={question}
              submitLabel="Save"
              autoFocus={formOpen || openInput}
              inputRef={addInputRef}
              onSave={onAdd}
              onCancel={hasItems || !openWhenEmpty ? closeForms : undefined}
            />
          </Animated.View>
        ) : (
          <Animated.View key="add-button" entering={motion.fadeIn} layout={motion.layout}>
            {/* Stays in place (just faded) while editing, so nothing below the editor jumps. */}
            <AddButton label={hasItems ? '+ Add another good thing' : '+ Add a good thing'} hidden={!!editingId} onPress={() => setFormOpen(true)} />
          </Animated.View>
        )}
      </View>
      <ConfirmDialog
        visible={!!deleteCandidate}
        quote={deleteCandidate?.text ?? ''}
        title="Are you sure you want to delete this entry?"
        note="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={removeConfirmed}
      />
      </>
    </LayoutAnimationConfig>
  );
}

function AddButton({ label, hidden, onPress }: { label: string; hidden: boolean; onPress: () => void }) {
  const styles = useDayStyles();
  const opacity = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    opacity.set(withTiming(hidden ? 0 : 1, fadeTiming()));
  }, [hidden, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={style} pointerEvents={hidden ? 'none' : 'auto'} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={hidden}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}>
        <Text weight="bold" size={16}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function useDayStyles() {
  return useStyles((c) => ({
    center: { textAlign: 'center' },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: space.sm,
      paddingVertical: 12,
      ...softShadow(c),
    },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.sheet,
    },
    addBtn: { backgroundColor: c.soft, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  }));
}
