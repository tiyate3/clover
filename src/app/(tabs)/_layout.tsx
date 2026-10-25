import { Tabs } from 'expo-router';
import { PillTabBar } from '@/components/PillTabBar';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const c = useTheme();
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Painted behind every tab, so switching tabs never flashes.
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="field" options={{ title: 'Meadow' }} />
      <Tabs.Screen name="highlights" options={{ title: 'Highlights' }} />
    </Tabs>
  );
}
