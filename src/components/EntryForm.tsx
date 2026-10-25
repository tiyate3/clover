import { Ref, useEffect, useRef, useState } from 'react';
import { Pressable, Switch, TextInputInstance, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { duration, fadeTiming, lightHaptic } from '@/lib/motion';
import { radius, softShadow, space, useStyles, useTheme } from '@/lib/theme';
import { EntryInput, INPUT_BOTTOM_INSET } from './EntryInput';
import { useFormTrailing } from './FormScrollView';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  /** Question shown above the box when adding. Editing in place leaves it out. */
  title?: string;
  initialText?: string;
  initialLucky?: boolean;
  submitLabel: string;
  autoFocus?: boolean;
  inputRef?: Ref<TextInputInstance | null>;
  onSave: (text: string, extraLucky: boolean) => void;
  /** Hides the Cancel link when left out. */
  onCancel?: () => void;
};

/** Resolves once the keyboard has fully gone, so layout changes never happen mid-slide. */
export function dismissKeyboard() {
  return Promise.race([KeyboardController.dismiss(), new Promise<void>((resolve) => setTimeout(resolve, 600))]);
}

/** Writing a good thing, the same for adding and editing. */
export function EntryForm({
  title,
  initialText = '',
  initialLucky = false,
  submitLabel,
  autoFocus = false,
  inputRef,
  onSave,
  onCancel,
}: Props) {
  const c = useTheme();
  const styles = useFormStyles();
  const [text, setText] = useState(initialText);
  const [extraLucky, setExtraLucky] = useState(initialLucky);
  const canSave = text.trim().length > 0;
  const trailing = useFormTrailing();
  const saving = useRef(false);
  const opacity = useSharedValue(1);
  const formStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // The form quietly fades while the keyboard slides away; the saved entry then settles in its place.
  const save = async () => {
    if (!canSave || saving.current) return;
    saving.current = true;
    lightHaptic();
    opacity.set(withTiming(0, fadeTiming(duration.base)));
    await dismissKeyboard();
    onSave(text, extraLucky);
  };

  const cancel = async () => {
    await dismissKeyboard();
    onCancel?.();
  };

  return (
    <Animated.View style={[styles.form, formStyle]}>
      {title && (
        <Text weight="extrabold" size={22} style={styles.center}>
          {title}
        </Text>
      )}
      <EntryInput ref={inputRef} value={text} onChangeText={setText} onSubmit={save} autoFocus={autoFocus} />
      <View
        style={styles.below}
        // Tell the scroll view how far the form reaches below the text, so it keeps all of it above the keyboard.
        onLayout={(e) => trailing?.set(space.md + e.nativeEvent.layout.height + INPUT_BOTTOM_INSET)}
      >
        <View style={styles.luckyRow}>
          <View style={{ flex: 1 }}>
            <Text weight="bold" size={16}>
              Extra lucky
            </Text>
            <Text size={13} color={c.muted}>
              Earns a golden four-leaf clover
            </Text>
          </View>
          <Switch
            value={extraLucky}
            onValueChange={setExtraLucky}
            trackColor={{ false: c.faint, true: c.gold }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={c.faint}
          />
        </View>
        <SaveButton label={submitLabel} visible={canSave} onPress={save} />
        {onCancel && (
          <Pressable onPress={cancel} hitSlop={10} style={styles.cancel}>
            <Text weight="bold" size={14} color={c.muted}>
              Cancel
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

/** Fades in once there's something to save and sinks softly under the finger. */
function SaveButton({ label, visible, onPress }: { label: string; visible: boolean; onPress: () => void }) {
  const c = useTheme();
  const styles = useFormStyles();
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(visible ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    shown.set(withTiming(visible ? 1 : 0, fadeTiming(duration.base)));
  }, [visible, shown]);

  const style = useAnimatedStyle(() => ({
    // Under Reduce Motion the press dims instead of shrinking.
    opacity: shown.value * (reduceMotion ? 1 - pressed.value * 0.15 : 1),
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.value * 0.03 }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(1, fadeTiming(120)))}
      onPressOut={() => pressed.set(withTiming(0, fadeTiming(200)))}
      disabled={!visible}
      accessibilityRole="button"
      accessibilityState={{ disabled: !visible }}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.button, style]}
    >
      <Text weight="bold" size={17} color={c.onPrimary}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function useFormStyles() {
  return useStyles((c) => ({
    form: { gap: space.md },
    below: { gap: space.md },
    center: { textAlign: 'center' },
    luckyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: space.md,
      paddingVertical: 14,
      ...softShadow(c),
    },
    button: { backgroundColor: c.primary, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center' },
    cancel: { alignSelf: 'center' },
  }));
}
