import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, LayoutAnimation } from 'react-native';
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
  useFocusEffect: (callback: () => void | (() => void)) => {
    const mockReact = require('react');

    mockReact.useEffect(() => callback(), [callback]);
  },
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
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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
    mockGetRideHistory.mockResolvedValue([]);

    await renderRideHistoryPage();

    expect(screen.getByText('Start your first ride!')).toBeTruthy();
    expect(screen.queryByText('Recent Rides')).toBeNull();
  }, 10000);

  it('toggles from week to month without reloading data', async () => {
    await renderRideHistoryPage();

    const monthButton = screen.getByText('Month');
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(mockGetDistanceStats).toHaveBeenCalledTimes(4);

    fireEvent.press(monthButton);
    await flushUi();

    expect(screen.getByText(/Total this month/i)).toBeTruthy();
    expect(screen.queryByTestId('ride-history-loading')).toBeNull();

    await waitFor(() => {
      expect(screen.getByText('Week 1')).toBeTruthy();
      expect(screen.queryByText('Mon')).toBeNull();
      expect(mockGetDistanceStats).toHaveBeenCalledTimes(4);
    });
  }, 10000);

  it('navigates to ride details when a ride item is pressed', async () => {
    await renderRideHistoryPage();

    const rideItem = screen.getByText('Waterfront Loop');
    fireEvent.press(rideItem);

    expect(mockNavigate).toHaveBeenCalledWith('HistoryDetails', { rideId: '1' });
  }, 10000);

  it('refreshes ride history when the history tab gains focus', async () => {
    await renderRideHistoryPage();

    await waitFor(() => {
      expect(mockGetRideHistory).toHaveBeenCalledTimes(2);
      expect(mockGetDistanceStats).toHaveBeenCalledTimes(4);
    });
  }, 10000);

  it('clears unknown favorite route ids from storage on load', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(['1', 'ghost-route']));

    await renderRideHistoryPage();

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('favoriteRoutes', JSON.stringify(['1']));
    });
  }, 10000);

  it('does not allow adding more than 3 unique favorite routes', async () => {
    mockGetRideHistory.mockResolvedValue([
      { id: '1', routeId: '1', routeName: 'Waterfront Loop', completionDate: 'March 12, 2026', completionTime: '10:30 AM', totalTime: 48, distance: 12.5, avgSpeed: 15.6, checkpoints: 3, userRating: 5 },
      { id: '2', routeId: '2', routeName: 'Mountain Ridge Trail', completionDate: 'March 10, 2026', completionTime: '2:15 PM', totalTime: 95, distance: 18.3, avgSpeed: 11.6, checkpoints: 5 },
      { id: '3', routeId: '3', routeName: 'City Express', completionDate: 'March 8, 2026', completionTime: '8:45 AM', totalTime: 32, distance: 8.2, avgSpeed: 15.4, checkpoints: 2 },
      { id: '4', routeId: '4', routeName: 'Sunset Sprint', completionDate: 'March 6, 2026', completionTime: '6:45 PM', totalTime: 30, distance: 7.6, avgSpeed: 15.2, checkpoints: 2 },
    ]);
    mockGetItem.mockResolvedValue(JSON.stringify(['1', '2', '3']));

    await renderRideHistoryPage();

    const addFavoriteIcon = screen.UNSAFE_getByProps({ name: 'star-outline' });
    fireEvent.press(addFavoriteIcon);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Favorites limit reached',
      expect.stringContaining('up to 3 routes')
    );
    expect(mockSetItem).not.toHaveBeenCalled();
  }, 10000);

  it('allows adding a third unique route when stored favorites contain duplicates', async () => {
    mockGetRideHistory.mockResolvedValue([
      { id: '1', routeId: '1', routeName: 'Waterfront Loop', completionDate: 'March 12, 2026', completionTime: '10:30 AM', totalTime: 48, distance: 12.5, avgSpeed: 15.6, checkpoints: 3, userRating: 5 },
      { id: '2', routeId: '2', routeName: 'Mountain Ridge Trail', completionDate: 'March 10, 2026', completionTime: '2:15 PM', totalTime: 95, distance: 18.3, avgSpeed: 11.6, checkpoints: 5 },
      { id: '3', routeId: '3', routeName: 'City Express', completionDate: 'March 8, 2026', completionTime: '8:45 AM', totalTime: 32, distance: 8.2, avgSpeed: 15.4, checkpoints: 2 },
    ]);
    mockGetItem.mockResolvedValue(JSON.stringify(['1', '1', '2']));

    await renderRideHistoryPage();

    const addFavoriteIcons = screen.UNSAFE_getAllByProps({ name: 'star-outline' });
    fireEvent.press(addFavoriteIcons[0]);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('favoriteRoutes', JSON.stringify(['1', '2', '3']));
    });
  }, 10000);

  it('keeps multiple distinct favorites when routes are selected one after another', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([]));

    await renderRideHistoryPage();

    let addFavoriteIcons = screen.UNSAFE_getAllByProps({ name: 'star-outline' });
    fireEvent.press(addFavoriteIcons[0]);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenLastCalledWith('favoriteRoutes', JSON.stringify(['1']));
    });

    addFavoriteIcons = screen.UNSAFE_getAllByProps({ name: 'star-outline' });
    fireEvent.press(addFavoriteIcons[0]);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenLastCalledWith('favoriteRoutes', JSON.stringify(['1', '2']));
    });
  }, 10000);

  it('treats multiple ride history entries of the same routeId as one unique favorite', async () => {
    mockGetRideHistory.mockResolvedValue([
      { id: 'ride-1', routeId: 'route-a', routeName: 'Waterfront Loop', completionDate: 'March 12, 2026', completionTime: '10:30 AM', totalTime: 48, distance: 12.5, avgSpeed: 15.6, checkpoints: 3, userRating: 5 },
      { id: 'ride-2', routeId: 'route-a', routeName: 'Waterfront Loop', completionDate: 'March 11, 2026', completionTime: '9:10 AM', totalTime: 46, distance: 12.5, avgSpeed: 16.0, checkpoints: 3, userRating: 4 },
      { id: 'ride-3', routeId: 'route-a', routeName: 'Waterfront Loop', completionDate: 'March 10, 2026', completionTime: '8:05 AM', totalTime: 47, distance: 12.5, avgSpeed: 15.8, checkpoints: 3, userRating: 5 },
      { id: 'ride-4', routeId: 'route-b', routeName: 'Mountain Ridge Trail', completionDate: 'March 9, 2026', completionTime: '2:15 PM', totalTime: 95, distance: 18.3, avgSpeed: 11.6, checkpoints: 5 },
      { id: 'ride-5', routeId: 'route-c', routeName: 'City Express', completionDate: 'March 8, 2026', completionTime: '8:45 AM', totalTime: 32, distance: 8.2, avgSpeed: 15.4, checkpoints: 2 },
    ]);
    mockGetItem.mockResolvedValue(JSON.stringify(['route-a', 'route-a', 'route-a']));

    await renderRideHistoryPage();

    const addFavoriteIcons = screen.UNSAFE_getAllByProps({ name: 'star-outline' });
    fireEvent.press(addFavoriteIcons[0]);

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('favoriteRoutes', JSON.stringify(['route-a', 'route-b']));
    });
    expect(Alert.alert).not.toHaveBeenCalledWith(
      'Favorites limit reached',
      expect.any(String)
    );
  }, 10000);
});
