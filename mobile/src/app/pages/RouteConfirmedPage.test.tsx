import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RouteConfirmedScreen from './RouteConfirmedPage';
import * as maps from '@/services/maps';
import { getRouteById } from '../types';

const mockResolveRouteById = jest.fn(async (id: string | undefined) => getRouteById(id) ?? null);

jest.mock('../../services/routeLookup', () => {
  return {
    resolveRouteById: (id: string | undefined) => mockResolveRouteById(id),
  };
});

const mockNavigate = jest.fn();
const mockRouteParams: { routeId?: string; route?: ReturnType<typeof getRouteById> } = { routeId: '1' };

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

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

describe('RouteConfirmedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.routeId = '1';
    delete mockRouteParams.route;
    mockResolveRouteById.mockImplementation(async (id: string | undefined) => getRouteById(id) ?? null);
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
    expect(mockNavigate).toHaveBeenCalledWith(
      'LiveMap',
      expect.objectContaining({
        routeId: '1',
        route: expect.objectContaining({ id: '1', name: 'Riverside Park Loop' }),
      }),
    );
  });

  it('renders from the passed route when the detail lookup fails', async () => {
    const route = getRouteById('1');
    mockRouteParams.routeId = route?.id;
    mockRouteParams.route = route;
    mockResolveRouteById.mockResolvedValueOnce(null);

    render(<RouteConfirmedScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('route-confirmed-summary')).toHaveTextContent(/Riverside Park Loop/);
    });
  });

  it('shows missing state for unknown id', async () => {
    mockRouteParams.routeId = 'unknown';
    render(<RouteConfirmedScreen />);
    await waitFor(() => expect(screen.getByTestId('route-confirmed-missing')).toBeTruthy());
    mockRouteParams.routeId = '1';
  });
});
