import '../../global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { RootNavigatorWithProvider } from './navigation';
import { ThemeProvider } from './ThemeContext';

function AppInner() {
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
      <RootNavigatorWithProvider />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
