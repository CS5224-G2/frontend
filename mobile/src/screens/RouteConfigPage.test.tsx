import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import RouteConfigPage from './RouteConfigPage';
import { STORAGE_KEYS } from '../constants/routeStorage';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('RouteConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  it('loads saved preferences from storage', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.userPreferences,
      JSON.stringify({
        cyclistType: 'fitness',
        preferredShade: 30,
        elevation: 40,
        distance: 15,
        airQuality: 60,
      })
    );
    await AsyncStorage.setItem(STORAGE_KEYS.routeStartPoint, 'A');
    await AsyncStorage.setItem(STORAGE_KEYS.routeEndPoint, 'B');

    render(<RouteConfigPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('route-config-loading')).toBeNull();
    });

    expect(screen.getByDisplayValue('A')).toBeTruthy();
    expect(screen.getByDisplayValue('B')).toBeTruthy();
  });

  it('persists and navigates to recommendations on Find Routes', async () => {
    render(<RouteConfigPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('route-config-loading')).toBeNull();
    });

    fireEvent.press(screen.getByTestId('route-config-find-routes'));

    await waitFor(async () => {
      const prefs = await AsyncStorage.getItem(STORAGE_KEYS.userPreferences);
      expect(prefs).toBeTruthy();
    });

    expect(mockPush).toHaveBeenCalledWith('/route');
  });
});
