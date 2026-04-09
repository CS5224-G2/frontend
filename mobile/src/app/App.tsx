import '../../global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';
import { seedFavoriteRouteIdsIfEmpty } from '../services/favoriteRoutesService';
import { RootNavigatorWithProvider } from './navigation';
import { ThemeProvider } from './ThemeContext';

function AppInner() {
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    seedFavoriteRouteIdsIfEmpty(['1', '3']).catch(() => undefined);
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
