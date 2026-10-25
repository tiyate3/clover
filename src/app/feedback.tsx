import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { Palette } from '@/lib/themes';
import { space, titleShadow, useStyles, useTheme } from '@/lib/theme';

const RECIPIENT = 'cloverproductteam@gmail.com';
const SUBJECT = 'Clover Feedback';
const CATEGORIES = ['Report a bug', 'Suggest a feature or improvement', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

/** Plain greys for this page, so it reads as neutral whatever the theme. Only the back link is green. */
function neutral(c: Palette) {
  return c.dark
    ? { background: '#1E1E20', surface: '#2A2A2D', selected: '#38383C', line: '#505055', strong: '#E5E5EA', text: '#F2F2F2', muted: '#9A9A9F', button: '#F2F2F2', onButton: '#1E1E20' }
    : { background: '#FCFCFC', surface: '#FFFFFF', selected: '#F2F2F4', line: '#E3E3E6', strong: '#1C1C1E', text: '#1C1C1E', muted: '#6E6E73', button: '#1C1C1E', onButton: '#FFFFFF' };
}

export default function FeedbackScreen() {
  const c = useTheme();
  const n = neutral(c);
  const styles = useFeedbackStyles();
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const copyOrShare = async (body: string) => {
    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      try {
        await globalThis.navigator.clipboard.writeText(body);
        globalThis.alert?.('Feedback copied. You can paste it into an email to cloverproductteam@gmail.com.');
        return;
      } catch {
        // Fall through to the system share sheet when clipboard access is unavailable.
      }
    }
    try {
      await Share.share({ title: SUBJECT, message: body });
    } catch {
      Alert.alert('Unable to share feedback', `Please email ${RECIPIENT} with your message.`);
    }
  };

  const sendFeedback = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const body = `Feedback type: ${category}\n\n${trimmed}`;
    const mailto = `mailto:${RECIPIENT}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(mailto);
    } catch {
      if (Platform.OS === 'web') {
        await copyOrShare(body);
      } else {
        Alert.alert('No email app found', 'You can copy your feedback from the share menu.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Copy feedback', onPress: () => void copyOrShare(body) },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityRole="button">
            <Text weight="semibold" size={16} color={c.dark ? c.cloverStroke : c.primary}>‹  Settings</Text>
          </Pressable>
          <Text weight="extrabold" size={28} color={n.text} style={titleShadow(c)}>Feedback &amp; Suggestions</Text>
          <Text size={15} color={n.muted} style={styles.intro}>
            Tell us what would make Clover better.
          </Text>

          <View style={styles.choices}>
            {CATEGORIES.map((option) => {
              const selected = option === category;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.choice, selected && styles.choiceSelected]}
                >
                  <Text weight={selected ? 'semibold' : 'regular'} size={15} color={n.text}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Write your feedback…"
            placeholderTextColor={n.muted}
            accessibilityLabel="Your feedback"
            multiline
            textAlignVertical="top"
            autoCapitalize="sentences"
            maxLength={3000}
            style={styles.input}
            selectionColor={n.strong}
          />
          <Text size={12} color={n.muted} style={styles.counter}>{message.length}/3000</Text>

          <Pressable
            onPress={() => void sendFeedback()}
            disabled={!message.trim() || sending}
            accessibilityRole="button"
            style={({ pressed }) => [styles.sendButton, (!message.trim() || sending) && styles.disabled, pressed && styles.pressed]}
          >
            <Text weight="bold" size={16} color={n.onButton}>{sending ? 'Opening email…' : 'Send feedback'}</Text>
          </Pressable>
          <Text size={13} color={n.muted} style={styles.footnote}>
            Your email app will open with the message ready to send.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useFeedbackStyles() {
  return useStyles((c) => {
    const n = neutral(c);
    const lift = { shadowColor: '#000000', shadowOpacity: c.dark ? 0.2 : 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 };
    return {
    safe: { flex: 1, backgroundColor: n.background },
    flex: { flex: 1 },
    content: { padding: space.lg, paddingBottom: space.xl, gap: space.md, flexGrow: 1 },
    back: { alignSelf: 'flex-start', paddingVertical: space.xs },
    intro: { lineHeight: 22, marginTop: -space.sm },
    choices: { gap: space.sm, marginTop: space.xs },
    choice: { minHeight: 48, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: 6, borderWidth: 1, borderColor: n.line, backgroundColor: n.surface, ...lift },
    choiceSelected: { borderColor: n.strong, backgroundColor: n.selected },
    input: { minHeight: 180, padding: space.md, borderRadius: 6, borderWidth: 1, borderColor: n.line, backgroundColor: n.surface, color: n.text, fontSize: 16, lineHeight: 23 },
    counter: { alignSelf: 'flex-end', marginTop: -space.sm },
    sendButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: n.button, borderRadius: 6, marginTop: space.xs },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.82 },
    footnote: { textAlign: 'center', lineHeight: 19 },
    };
  });
}
