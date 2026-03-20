import { Stack } from 'expo-router';

/**
 * Root layout — stack navigation.
 * Add or replace screens here; keep route names stable so the team can plug in implementation.
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'CycleLink',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      <Stack.Screen name="home" options={{ title: 'Home' }} />
      <Stack.Screen name="route" options={{ title: 'Route' }} />
      <Stack.Screen name="feedback" options={{ title: 'Rate your ride' }} />
    </Stack>
  );
}
