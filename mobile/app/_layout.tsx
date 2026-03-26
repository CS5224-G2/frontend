import '../global.css';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import { Platform, View, StatusBar as RNStatusBar, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider } from '@/app/AuthContext';
import { ThemeProvider } from '@/app/ThemeContext';

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

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
      {Platform.OS === 'android' && (
        <View style={{ height: RNStatusBar.currentHeight ?? 24, backgroundColor: 'white' }} />
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={60}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { height: insets.top, bottom: undefined }]}
          experimentalBlurMethod="dimezisBlurView"
        />
      )}
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
