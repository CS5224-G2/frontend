import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type ColorSchemePref = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ColorSchemePref;
  setPreference: (pref: ColorSchemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  setPreference: () => {},
});

const STORAGE_KEY = 'colorScheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ColorSchemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      const pref = (value as ColorSchemePref | null) ?? 'system';
      setPreferenceState(pref);
      colorScheme.set(pref);
    });
  }, []);

  const setPreference = (pref: ColorSchemePref) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
    colorScheme.set(pref);
  };

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
