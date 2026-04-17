import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import * as userService from '../../services/userService';

/** Use dev-client path so tests exercise Mapbox screen (not Expo Go-only UI). */
jest.mock('expo-constants', () => {
  const { ExecutionEnvironment } = jest.requireActual('expo-constants');
  return {
    __esModule: true,
    ExecutionEnvironment,
    default: {
      executionEnvironment: ExecutionEnvironment.Bare,
      expoConfig: {},
    },
  };
});

import LiveMapScreen from './LiveMapPage';
import { routeToLineCoordinates } from '@/utils/routeGeometry';
import { mockRoutes } from '../types';

jest.mock('../../services/routeLookup', () => {
  const types = jest.requireActual('../types') as { getRouteById: (id: string | undefined) => unknown };
  return {
    resolveRouteById: jest.fn(async (id: string | undefined) => {
      const r = types.getRouteById(id);
      return r ?? null;
    }),
  };
});

const mockNavigate = jest.fn();
const mockRouteParams: { routeId?: string; route?: (typeof mockRoutes)[number] } = {
  routeId: '1',
  route: mockRoutes[0],
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => insets,
  };
});

jest.mock('nativewind', () => ({
  useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
}));

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GlassView: ({ children, ...props }: any) =>
      React.createElement(View, { ...props, testID: props.testID ?? 'glass-view' }, children),
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn().mockResolvedValue({
    userId: 'rider_1024',
    fullName: 'Alex Johnson',
    email: 'alex@example.com',
    location: 'Singapore',
    memberSince: 'January 2025',
    cyclingPreference: 'Leisure',
    weeklyGoalKm: 80,
    bio: 'Weekend rider.',
    avatarUrl: null,
    avatarColor: '#7c3aed',
    stats: { totalRides: 5, totalDistanceKm: 42.0, favoriteTrails: 2 },
  }),
}));

describe('LiveMapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.routeId = '1';
    mockRouteParams.route = mockRoutes[0];
  });

  it('renders map view when token is set (native module mocked)', async () => {
    const prev = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

    render(<LiveMapScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('live-map-mapview')).toBeTruthy();
    });

    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = prev;
  });

  it('shows fallback when token is missing', async () => {
    const prev = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

    render(<LiveMapScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('live-map-no-token')).toBeTruthy();
    });

    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = prev;
  });

  it('polyline for mock route 1 matches geometry helper', () => {
    const route = mockRoutes[0];
    const coords = routeToLineCoordinates(route);
    expect(coords.length).toBeGreaterThan(2);
    expect(coords[0][0]).toBe(route.startPoint.lng);
  });

  it('fetches user profile on mount', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

    render(<LiveMapScreen />);

    await waitFor(() => {
      expect(userService.getUserProfile).toHaveBeenCalledTimes(1);
    });

    delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  });

  it('renders rider marker when token is set', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

    // Use coordinates near the mock route start point (Central Park, NYC)
    // so advanceActiveRideSession accepts the position and sets tracking.position
    const Location = jest.requireMock('expo-location');
    Location.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 40.7829, longitude: -73.9654, accuracy: 10 },
    });
    Location.watchPositionAsync.mockImplementation((_options: unknown, callback: (pos: object) => void) => {
      const subscription = { remove: jest.fn() };
      return new Promise((resolve) => {
        setImmediate(() => {
          if (typeof callback === 'function') {
            callback({ coords: { latitude: 40.7829, longitude: -73.9654, accuracy: 10 }, timestamp: Date.now() });
          }
          resolve(subscription);
        });
      });
    });

    render(<LiveMapScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('rider-marker-container')).toBeTruthy();
    }, { timeout: 5000 });

    delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  });

  it('renders map view in dark mode without crashing', async () => {
    // Override the nativewind mock to return dark mode for this test
    const nativewindMock = jest.requireMock('nativewind');
    nativewindMock.useColorScheme.mockReturnValueOnce({ colorScheme: 'dark' });

    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = 'pk.test_jest_token';

    render(<LiveMapScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('live-map-mapview')).toBeTruthy();
    });

    delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  });
});
