import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider } from '../lib/store';
import { useTheme } from '../lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <Inner />
      </DataProvider>
    </SafeAreaProvider>
  );
}

function Inner() {
  const t = useTheme();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.accent,
          headerTitleStyle: { color: t.text },
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="attempt/[id]" options={{ title: 'Edit attempt' }} />
      </Stack>
    </>
  );
}
