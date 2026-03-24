import { Stack } from 'expo-router';

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
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
      <Stack.Screen name="route" options={{ title: 'Recommended routes' }} />
      <Stack.Screen name="route-config" options={{ title: 'Configure route' }} />
      <Stack.Screen
        name="route-confirmed/[routeId]"
        options={{ title: 'Route confirmed', headerShown: false }}
      />
      <Stack.Screen name="live-map/[routeId]" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ title: 'Rate your ride' }} />
    </Stack>
  );
}
