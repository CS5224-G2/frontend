import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './ThemeContext';

jest.mock('nativewind', () => ({
  colorScheme: { set: jest.fn() },
  useColorScheme: () => ({ colorScheme: 'light' }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('ThemeContext', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('defaults to system when no stored preference', async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    await act(async () => {});
    expect(result.current.preference).toBe('system');
  });

  it('restores dark preference saved in AsyncStorage', async () => {
    await AsyncStorage.setItem('colorScheme', 'dark');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    await act(async () => {});
    expect(result.current.preference).toBe('dark');
  });

  it('setPreference saves to AsyncStorage and calls colorScheme.set', async () => {
    const { colorScheme } = require('nativewind');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    await act(async () => {});
    await act(async () => {
      result.current.setPreference('dark');
    });
    expect(await AsyncStorage.getItem('colorScheme')).toBe('dark');
    expect(colorScheme.set).toHaveBeenCalledWith('dark');
    expect(result.current.preference).toBe('dark');
  });

  it('setPreference("system") calls colorScheme.set("system")', async () => {
    const { colorScheme } = require('nativewind');
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });
    await act(async () => {});
    await act(async () => {
      result.current.setPreference('system');
    });
    expect(colorScheme.set).toHaveBeenCalledWith('system');
  });
});
