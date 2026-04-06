import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RouteConfirmedScreen from './RouteConfirmedPage';
import * as maps from '@/services/maps';

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
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => insets,
  };
});

jest.mock('@/services/maps', () => ({
  openRouteInMaps: jest.fn(() => Promise.resolve()),
}));

describe('RouteConfirmedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows summary for a valid route', async () => {
    render(<RouteConfirmedScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('route-confirmed-title')).toHaveTextContent('Route Confirmed!');
    });
    expect(screen.getByTestId('route-confirmed-summary')).toHaveTextContent(/Riverside Park Loop/);
  });

  it('opens external maps when requested', async () => {
    render(<RouteConfirmedScreen />);
    await waitFor(() => expect(screen.getByTestId('route-confirmed-external-maps')).toBeTruthy());
    fireEvent.press(screen.getByTestId('route-confirmed-external-maps'));
    await Promise.resolve();
    expect(maps.openRouteInMaps).toHaveBeenCalled();
  });

  it('navigates to live map for Start Cycling', async () => {
    render(<RouteConfirmedScreen />);
    await waitFor(() => expect(screen.getByTestId('route-confirmed-start-cycling')).toBeTruthy());
    fireEvent.press(screen.getByTestId('route-confirmed-start-cycling'));
    expect(mockNavigate).toHaveBeenCalledWith('LiveMap', { routeId: '1' });
  });

  it('shows missing state for unknown id', async () => {
    mockRouteParams.routeId = 'unknown';
    render(<RouteConfirmedScreen />);
    await waitFor(() => expect(screen.getByTestId('route-confirmed-missing')).toBeTruthy());
    mockRouteParams.routeId = '1';
  });
});
