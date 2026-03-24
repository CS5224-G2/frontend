import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import RouteConfirmedPage from './RouteConfirmedPage';
import * as maps from '../services/maps';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('../services/maps', () => ({
  openRouteInMaps: jest.fn(() => Promise.resolve()),
}));

describe('RouteConfirmedPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows summary for a valid route', () => {
    render(<RouteConfirmedPage routeId="1" />);
    expect(screen.getByTestId('route-confirmed-title')).toHaveTextContent('Route Confirmed!');
    expect(screen.getByTestId('route-confirmed-summary')).toHaveTextContent(/Riverside Park Loop/);
  });

  it('opens external maps when requested', async () => {
    render(<RouteConfirmedPage routeId="2" />);
    fireEvent.press(screen.getByTestId('route-confirmed-external-maps'));
    await Promise.resolve();
    expect(maps.openRouteInMaps).toHaveBeenCalled();
  });

  it('navigates to live map for Start Cycling', () => {
    render(<RouteConfirmedPage routeId="3" />);
    fireEvent.press(screen.getByTestId('route-confirmed-start-cycling'));
    expect(mockPush).toHaveBeenCalledWith('/live-map/3');
  });

  it('shows missing state for unknown id', () => {
    render(<RouteConfirmedPage routeId="unknown" />);
    expect(screen.getByTestId('route-confirmed-missing')).toBeTruthy();
  });
});
