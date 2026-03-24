import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RouteConfirmedScreen from './RouteConfirmedPage';
import * as maps from '@/services/maps';

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

jest.mock('@/services/maps', () => ({
  openRouteInMaps: jest.fn(() => Promise.resolve()),
}));

describe('RouteConfirmedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows summary for a valid route', () => {
    render(<RouteConfirmedScreen />);
    expect(screen.getByTestId('route-confirmed-title')).toHaveTextContent('Route Confirmed!');
    expect(screen.getByTestId('route-confirmed-summary')).toHaveTextContent(/Riverside Park Loop/);
  });

  it('opens external maps when requested', async () => {
    render(<RouteConfirmedScreen />);
    fireEvent.press(screen.getByTestId('route-confirmed-external-maps'));
    await Promise.resolve();
    expect(maps.openRouteInMaps).toHaveBeenCalled();
  });

  it('navigates to live map for Start Cycling', () => {
    render(<RouteConfirmedScreen />);
    fireEvent.press(screen.getByTestId('route-confirmed-start-cycling'));
    expect(mockNavigate).toHaveBeenCalledWith('LiveMap', { routeId: '1' });
  });

  it('shows missing state for unknown id', () => {
    mockRouteParams.routeId = 'unknown';
    render(<RouteConfirmedScreen />);
    expect(screen.getByTestId('route-confirmed-missing')).toBeTruthy();
    mockRouteParams.routeId = '1';
  });
});
