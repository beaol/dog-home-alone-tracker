import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View, type ColorValue } from 'react-native';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

export default function TabsLayout() {
  const { ready, data } = useStore();
  const t = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!data.onboarded) return <Redirect href="/onboarding" />;

  const icon = (name: keyof typeof Ionicons.glyphMap) =>
    function TabIcon({ color, size }: { color: ColorValue; size: number }) {
      return <Ionicons name={name} color={color as string} size={size} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.border },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Plan', tabBarIcon: icon('paw') }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: icon('stopwatch') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('trending-up') }} />
      <Tabs.Screen name="guide" options={{ title: 'Guide', tabBarIcon: icon('book') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
