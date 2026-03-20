import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootNavigatorWithProvider } from './navigation';

export default function App() {
  // Initialize mock data for demonstration
  useEffect(() => {
    const initializeData = async () => {
      // Initialize starred routes if not already set (for mockup purposes)
      const existingRoutes = await AsyncStorage.getItem('favoriteRoutes');
      if (!existingRoutes) {
        await AsyncStorage.setItem('favoriteRoutes', JSON.stringify(['1', '3']));
      }
    };
    initializeData();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigatorWithProvider />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}