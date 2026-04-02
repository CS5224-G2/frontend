import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LayoutAnimation } from 'react-native';
import RideHistoryPage from './RideHistoryPage';
import { AuthContext } from '../AuthContext';

const mockNavigate = jest.fn();
const mockGetRideHistory = jest.fn();
const mockGetDistanceStats = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
}));

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(View, props),
  };
});

jest.mock('expo-glass-effect', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GlassView: (props: any) => React.createElement(View, props),
    GlassContainer: (props: any) => React.createElement(View, props),
    isLiquidGlassAvailable: () => false,
    isGlassEffectAPIAvailable: () => false,
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const makeChain = () => ({
    duration: () => makeChain(),
    delay: () => makeChain(),
    springify: () => makeChain(),
    damping: () => makeChain(),
    stiffness: () => makeChain(),
  });

  const Reanimated = {
    View,
    Text,
    default: {
      View,
      Text,
    },
    FadeInDown: makeChain(),
    FadeInRight: makeChain(),
    FadeOutLeft: makeChain(),
    FadeOutUp: makeChain(),
    LinearTransition: makeChain(),
    createAnimatedComponent: (Component: React.ComponentType<any>) => Component,
  };

  return {
    ...Reanimated,
    default: Reanimated,
  };
});

jest.mock('../../services/rideService', () => ({
  getRideHistory: (...args: unknown[]) => mockGetRideHistory(...args),
  getDistanceStats: (...args: unknown[]) => mockGetDistanceStats(...args),
}));

describe('RideHistoryPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(LayoutAnimation, 'configureNext').mockImplementation(() => {});

    mockGetRideHistory.mockResolvedValue([
      { id: '1', routeId: '1', routeName: 'Waterfront Loop', completionDate: 'March 12, 2026', completionTime: '10:30 AM', totalTime: 48, distance: 12.5, avgSpeed: 15.6, checkpoints: 3, userRating: 5 },
      { id: '2', routeId: '2', routeName: 'Mountain Ridge Trail', completionDate: 'March 10, 2026', completionTime: '2:15 PM', totalTime: 95, distance: 18.3, avgSpeed: 11.6, checkpoints: 5 },
      { id: '3', routeId: '3', routeName: 'City Express', completionDate: 'March 8, 2026', completionTime: '8:45 AM', totalTime: 32, distance: 8.2, avgSpeed: 15.4, checkpoints: 2 },
    ]);

    mockGetDistanceStats.mockImplementation((period: string) => Promise.resolve(
      period === 'week'
        ? [
            { id: 'mon', day: 'Mon', distance: 0 }, { id: 'tue', day: 'Tue', distance: 8.2 },
            { id: 'wed', day: 'Wed', distance: 0 }, { id: 'thu', day: 'Thu', distance: 18.3 },
            { id: 'fri', day: 'Fri', distance: 0 }, { id: 'sat', day: 'Sat', distance: 12.5 },
            { id: 'sun', day: 'Sun', distance: 0 },
          ]
        : [
            { id: 'week1', week: 'Week 1', distance: 45.5 }, { id: 'week2', week: 'Week 2', distance: 38.9 },
            { id: 'week3', week: 'Week 3', distance: 52.3 }, { id: 'week4', week: 'Week 4', distance: 39.0 },
          ]
    ));
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(null);
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider
        value={{
          login: jest.fn(),
          logout: jest.fn(),
          isLoggedIn: true,
          isRestoring: false,
          role: 'user',
          user: null,
        }}
      >
        {component}
      </AuthContext.Provider>
    );
  };

  const flushUi = async () => {
    await act(async () => {});
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await act(async () => {});
  };

  const renderRideHistoryPage = async () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);
    await flushUi();
    await screen.findByText('Ride History');
    await flushUi();
  };

  it('renders loaded weekly ride history data', async () => {
    await renderRideHistoryPage();

    expect(screen.getByText('Ride History')).toBeTruthy();
    expect(screen.getByText('Distance Over Time')).toBeTruthy();
    expect(screen.getByText('Recent Rides')).toBeTruthy();
    expect(screen.getByText(/Total this week/i)).toBeTruthy();
    expect(screen.getByText('Waterfront Loop')).toBeTruthy();
    expect(screen.getByText('Mountain Ridge Trail')).toBeTruthy();
    expect(screen.getByText('City Express')).toBeTruthy();
    expect(screen.getByText('2h 55m')).toBeTruthy();
  }, 10000);

  it('shows the empty state when no rides are returned', async () => {
    mockGetRideHistory.mockResolvedValueOnce([]);

    await renderRideHistoryPage();

    expect(screen.getByText('Start your first ride!')).toBeTruthy();
    expect(screen.queryByText('Recent Rides')).toBeNull();
  }, 10000);

  it('toggles from week to month without reloading data', async () => {
    await renderRideHistoryPage();

    const monthButton = screen.getByText('Month');
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(mockGetDistanceStats).toHaveBeenCalledTimes(2);

    fireEvent.press(monthButton);
    await flushUi();

    expect(screen.getByText(/Total this month/i)).toBeTruthy();
    expect(screen.queryByTestId('ride-history-loading')).toBeNull();

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeTruthy();
      expect(screen.queryByText('Mon')).toBeNull();
      expect(mockGetDistanceStats).toHaveBeenCalledTimes(2);
    });
  }, 10000);

  it('navigates to ride details when a ride item is pressed', async () => {
    await renderRideHistoryPage();

    const rideItem = screen.getByText('Waterfront Loop');
    fireEvent.press(rideItem);

    expect(mockNavigate).toHaveBeenCalledWith('HistoryDetails', { rideId: '1' });
  }, 10000);
});
