import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

import LiveMapScreen from './LiveMapPage';
import { routeToLineCoordinates } from '@/utils/routeGeometry';
import { mockRoutes } from '../types';

const mockNavigate = jest.fn();
const mockRouteParams = { routeId: '1' };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('LiveMapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.routeId = '1';
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

  it('shows fallback when token is missing', () => {
    const prev = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    delete process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

    render(<LiveMapScreen />);

    expect(screen.getByTestId('live-map-no-token')).toBeTruthy();

    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = prev;
  });

  it('polyline for mock route 1 matches geometry helper', () => {
    const route = mockRoutes[0];
    const coords = routeToLineCoordinates(route);
    expect(coords.length).toBeGreaterThan(2);
    expect(coords[0][0]).toBe(route.startPoint.lng);
  });
});
