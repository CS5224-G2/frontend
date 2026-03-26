import '../global.css';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';

import { AuthProvider } from '@/app/AuthContext';
import { ThemeProvider } from '@/app/ThemeContext';

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    const initializeData = async () => {
      const existingRoutes = await AsyncStorage.getItem('favoriteRoutes');
      if (!existingRoutes) {
        await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(['1', '3']));
      }
    };
    initializeData();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
