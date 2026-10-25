import { Ref, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, TextInputContentSizeChangeEvent, TextInputInstance, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { whenReadyForInput } from '@/lib/interactive';
import { fadeTiming, useEntryMotion } from '@/lib/motion';
import { radius, useStyles, useTheme } from '@/lib/theme';
import { Text } from './Text';

const LINE = 24;
const PAD_V = 15;
/** Top and bottom border, so the text never sits under the edge. */
const CHROME = PAD_V * 2 + 2;
/** Space between the bottom of the text itself and the bottom edge of the box. */
export const INPUT_BOTTOM_INSET = PAD_V + 1;
const MIN_HEIGHT = LINE * 3 + CHROME;
/** Past about seven lines the box stops growing and scrolls instead. */
const MAX_HEIGHT = LINE * 7 + CHROME;
/** The counter only appears once this few characters are left. */
const COUNTER_THRESHOLD = 20;

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  ref?: Ref<TextInputInstance | null>;
};

/**
 * The one text box for writing a good thing, used for adding and editing.
 * It grows with the text, softly lifts and turns sage on focus, and only shows
 * the character count when the limit is close.
 */
export function EntryInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'One good or lucky thing…',
  maxLength = 140,
  autoFocus = false,
  accessibilityLabel = 'Good thing',
  ref,
}: Props) {
  const c = useTheme();
  const styles = useInputStyles();
  const { fadeIn, fadeOut } = useEntryMotion();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => inputRef.current as TextInputInstance);

  const height = useSharedValue(MIN_HEIGHT);
  const focus = useSharedValue(0);
  const measured = useRef(false);
  const cursorPlaced = useRef(false);
  const [scrollable, setScrollable] = useState(false);
  const focusPending = useRef(autoFocus);

  // Focus once the box has its real height and nothing covers the app (opening animation, Face ID),
  // so the keyboard lifts the layout in one smooth move.
  const focusWhenSized = () => {
    if (!focusPending.current) return;
    focusPending.current = false;
    void whenReadyForInput().then(() => {
      // Put the cursor after any existing text before the keyboard appears.
      inputRef.current?.setSelection(value.length, value.length);
      inputRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!autoFocus) return;
    // Fallback in case no size event arrives.
    const timer = setTimeout(focusWhenSized, 120);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContentSizeChange = (e: TextInputContentSizeChangeEvent) => {
    const content = e.nativeEvent.contentSize.height;
    const target = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, content + CHROME));
    // The first measurement (e.g. opening an edit) sizes the box at once, then later lines ease in.
    height.set(!measured.current || reduceMotion ? target : withTiming(target, fadeTiming(180)));
    measured.current = true;
    setScrollable(content + CHROME > MAX_HEIGHT);
    focusWhenSized();
  };

  const onFocus = () => {
    focus.set(withTiming(1, fadeTiming()));
    // When editing, make sure the cursor starts after the existing text.
    if (!cursorPlaced.current && value.length > 0) {
      inputRef.current?.setSelection(value.length, value.length);
    }
    cursorPlaced.current = true;
  };

  // The outline while typing: sage in light mode, the deep button green in dark mode.
  const focusColor = c.dark ? c.primary : c.cloverFill;
  const boxStyle = useAnimatedStyle(() => ({
    height: height.value,
    borderColor: interpolateColor(focus.value, [0, 1], [c.line, focusColor]),
    shadowOpacity: focus.value * 0.07,
    elevation: focus.value * 2,
    transform: [{ translateY: reduceMotion ? 0 : focus.value * -1.5 }],
  }));

  const remaining = maxLength - value.length;

  return (
    <View>
      <Pressable onPress={() => inputRef.current?.focus()} accessible={false}>
        <Animated.View style={[styles.box, boxStyle]}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={c.muted}
            style={styles.input}
            accessibilityLabel={accessibilityLabel}
            multiline
            scrollEnabled={scrollable}
            textAlignVertical="top"
            autoCapitalize="sentences"
            onContentSizeChange={onContentSizeChange}
            onFocus={onFocus}
            onBlur={() => focus.set(withTiming(0, fadeTiming()))}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={onSubmit}
            maxLength={maxLength}
            selectionColor={c.cloverFill}
            cursorColor={c.cloverFill}
          />
        </Animated.View>
      </Pressable>
      {remaining <= COUNTER_THRESHOLD && (
        <Animated.View entering={fadeIn} exiting={fadeOut} style={styles.counter} pointerEvents="none">
          <Text
            weight="semibold"
            size={12}
            color={remaining === 0 ? c.goldStroke : c.muted}
            accessibilityLabel={`${remaining} characters left`}
          >
            {remaining}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

function useInputStyles() {
  return useStyles((c) => ({
    box: {
      backgroundColor: c.sheet,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 16,
      paddingVertical: PAD_V,
      shadowColor: c.text,
      shadowOpacity: 0,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    input: {
      flex: 1,
      padding: 0,
      fontWeight: '400',
      fontSize: 17,
      lineHeight: LINE,
      color: c.text,
    },
    // Sits in the gap below the box so showing it never shifts the layout.
    counter: { position: 'absolute', top: '100%', right: 4, marginTop: 3 },
  }));
}
