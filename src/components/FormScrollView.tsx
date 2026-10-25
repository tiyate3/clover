import { createContext, ReactNode, useContext, useEffect } from 'react';
import { findNodeHandle, Platform, ScrollViewProps, StyleProp, View, ViewStyle } from 'react-native';
import {
  useKeyboardHandler,
  useReanimatedFocusedInput,
  useWindowDimensions as useKeyboardWindow,
} from 'react-native-keyboard-controller';
import Animated, {
  interpolate,
  measure,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { useScrollToTopOnLeave } from '@/lib/useScrollToTopOnLeave';

/** Breathing room between the bottom of the open form and the top of the keyboard. */
const KEYBOARD_GAP = 16;
/** Never scroll the text box itself off the top of the screen. */
const TOP_GAP = 12;

/**
 * How far the open form reaches below its focused text box (Extra lucky, Save, Cancel).
 * Forms report it so the whole form, not just the caret, is kept above the keyboard.
 */
const FormTrailingContext = createContext<SharedValue<number> | null>(null);
export const useFormTrailing = () => useContext(FormTrailingContext);

const NO_SCROLL = { current: null };

type Props = Omit<ScrollViewProps, 'contentContainerStyle'> & {
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Set when a parent (like a KeyboardAvoidingView around a sheet) already keeps this view above
   * the keyboard. It then only scrolls within its own frame and adds no extra space.
   */
  liftedByParent?: boolean;
  /** Back to the top when the screen is left (Today, as a tab). */
  topOnLeave?: boolean;
  children: ReactNode;
};

/**
 * A ScrollView that moves frame by frame with the keyboard so the whole open
 * form sits just above it, then glides back to where it was when the keyboard leaves.
 * Works for a fixed page (Today) and for a sheet that lifts and shrinks with the
 * keyboard (Clovers), since it re-measures its own frame on every frame.
 */
export function FormScrollView({ children, contentContainerStyle, liftedByParent = false, topOnLeave = false, ...rest }: Props) {
  const ref = useAnimatedRef<Animated.ScrollView>();
  useScrollToTopOnLeave(topOnLeave ? ref : NO_SCROLL);
  const offset = useScrollOffset(ref);
  const { input } = useReanimatedFocusedInput();
  const { height: windowHeight } = useKeyboardWindow();
  const trailing = useSharedValue(0);

  const spacer = useSharedValue(0);
  const keyboard = useSharedValue(0);
  const fromKeyboard = useSharedValue(0);
  const toKeyboard = useSharedValue(0);
  const fromScroll = useSharedValue(0);
  const restoreScroll = useSharedValue(0);
  /** The focused text box in content coordinates, which don't change while the keyboard moves. */
  const inputTop = useSharedValue(0);
  const inputBottom = useSharedValue(0);
  const animating = useSharedValue(false);
  /** Native tag of this ScrollView, so inputs on other screens (tabs stay mounted) are ignored. */
  const tag = useSharedValue(-1);
  const owned = useSharedValue(false);
  const contentHeight = useSharedValue(0);

  /** Where to scroll so the open form clears a keyboard of this height, given where this view is right now. */
  const targetFor = (keyboardHeight: number) => {
    'worklet';
    const view = measure(ref);
    if (!view) return offset.value;
    const viewBottom = view.pageY + view.height;
    const visibleBottom = liftedByParent ? viewBottom : Math.min(viewBottom, windowHeight - keyboardHeight);
    const needed = view.pageY + inputBottom.value + trailing.value + KEYBOARD_GAP - visibleBottom;
    return Math.max(fromScroll.value, Math.min(needed, inputTop.value - TOP_GAP));
  };

  /** Only the part of this view the keyboard actually covers needs extra room to scroll into. */
  const updateSpacer = (keyboardHeight: number) => {
    'worklet';
    if (liftedByParent) return;
    const view = measure(ref);
    if (view) spacer.value = Math.max(0, view.pageY + view.height - (windowHeight - keyboardHeight));
  };

  const rememberInput = () => {
    'worklet';
    const layout = input.value?.layout;
    const view = measure(ref);
    if (!layout || !view) return;
    inputTop.value = layout.absoluteY - view.pageY + offset.value;
    inputBottom.value = inputTop.value + layout.height;
  };

  const settle = (height: number) => {
    'worklet';
    return height > 0 ? targetFor(height) : restoreScroll.value;
  };

  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        const opening = keyboard.value === 0 && e.height > 0;
        // Ownership is decided while showing; on hide the input may already be blurred.
        if (e.height > 0) owned.value = input.value?.parentScrollViewTarget === tag.value;
        if (!owned.value) return;
        if (opening) restoreScroll.value = offset.value;
        if (e.height > 0) rememberInput();
        fromKeyboard.value = keyboard.value;
        toKeyboard.value = e.height;
        fromScroll.value = offset.value;
        animating.value = true;
      },
      onMove: (e) => {
        'worklet';
        keyboard.value = e.height;
        if (!owned.value) return;
        updateSpacer(e.height);
        if (e.height > 0 && toKeyboard.value > 0) {
          scrollTo(ref, 0, targetFor(e.height), false);
        } else if (fromKeyboard.value !== toKeyboard.value) {
          const t = interpolate(e.height, [fromKeyboard.value, toKeyboard.value], [0, 1], 'clamp');
          scrollTo(ref, 0, fromScroll.value + (restoreScroll.value - fromScroll.value) * t, false);
        }
      },
      onInteractive: (e) => {
        'worklet';
        keyboard.value = e.height;
        if (owned.value) updateSpacer(e.height);
      },
      onEnd: (e) => {
        'worklet';
        // Covers focus changes and instant transitions where no frames were sent.
        keyboard.value = e.height;
        animating.value = false;
        if (!owned.value) return;
        updateSpacer(e.height);
        const target = settle(e.height);
        if (Math.abs(offset.value - target) > 1) scrollTo(ref, 0, target, true);
        if (e.height === 0) owned.value = false;
      },
    },
    [windowHeight, liftedByParent],
  );

  // As the text box grows line by line, keep the form's bottom edge clear of the keyboard.
  useAnimatedReaction(
    () => input.value?.layout.height ?? 0,
    (height, previous) => {
      if (previous === null || height <= previous || animating.value || !owned.value || keyboard.value === 0) return;
      rememberInput();
      fromScroll.value = offset.value;
      const target = targetFor(keyboard.value);
      if (target > offset.value + 1) scrollTo(ref, 0, target, true);
    },
  );

  // In a sheet whose content eases taller (an editor opening), follow the growth frame by frame
  // so the form's bottom edge is never left below the sheet. The text box itself doesn't move in
  // content coordinates, so the position remembered when the keyboard opened still holds.
  useAnimatedReaction(
    () => contentHeight.value,
    (height, previous) => {
      if (!liftedByParent || previous === null || height <= previous || !owned.value || keyboard.value === 0) return;
      const target = targetFor(keyboard.value);
      if (target > offset.value + 0.5) scrollTo(ref, 0, target, false);
    },
  );

  // Known as soon as it mounts (not only after onLayout), so an input focused straight away still counts.
  useEffect(() => {
    // Native only: web has no node handles (and no software keyboard to lift the form above).
    if (Platform.OS === 'web') return;
    tag.set(findNodeHandle(ref.current) ?? -1);
  }, [ref, tag]);

  const spacerStyle = useAnimatedStyle(() => ({ height: spacer.value }));

  return (
    <FormTrailingContext.Provider value={trailing}>
      <Animated.ScrollView
        ref={ref}
        onLayout={() => Platform.OS !== 'web' && tag.set(findNodeHandle(ref.current) ?? -1)}
        contentContainerStyle={{ flexGrow: 1 }}
        {...rest}
        onContentSizeChange={(w, h) => {
          contentHeight.set(h);
          rest.onContentSizeChange?.(w, h);
        }}
      >
        <View style={contentContainerStyle}>{children}</View>
        <Animated.View style={spacerStyle} />
      </Animated.ScrollView>
    </FormTrailingContext.Provider>
  );
}
