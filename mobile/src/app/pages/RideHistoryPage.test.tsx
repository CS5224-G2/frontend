import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import RideHistoryPage from './RideHistoryPage';
import { AuthContext } from '../AuthContext';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View {...props} />,
  };
});

// All mock data defined INSIDE the factory to avoid jest.mock hoisting issues
jest.mock('../../services/rideService', () => ({
  getRideHistory: jest.fn().mockResolvedValue([
    { id: '1', routeId: '1', routeName: 'Waterfront Loop', completionDate: 'March 12, 2026', completionTime: '10:30 AM', totalTime: 48, distance: 12.5, avgSpeed: 15.6, checkpoints: 3, userRating: 5 },
    { id: '2', routeId: '2', routeName: 'Mountain Ridge Trail', completionDate: 'March 10, 2026', completionTime: '2:15 PM', totalTime: 95, distance: 18.3, avgSpeed: 11.6, checkpoints: 5 },
    { id: '3', routeId: '3', routeName: 'City Express', completionDate: 'March 8, 2026', completionTime: '8:45 AM', totalTime: 32, distance: 8.2, avgSpeed: 15.4, checkpoints: 2 },
  ]),
  getDistanceStats: jest.fn((period: string) => Promise.resolve(
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
  )),
}));

describe('RideHistoryPage', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={{ login: jest.fn(), logout: jest.fn(), isLoggedIn: true }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders correctly', async () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    await waitFor(() => expect(screen.getByText('Ride History')).toBeTruthy());
    expect(screen.getByText('Total Rides')).toBeTruthy();
    expect(screen.getByText('Distance Over Time')).toBeTruthy();
    expect(screen.getByText('Recent Rides')).toBeTruthy();
  });

  it('renders summary values', async () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    // Total Rides should be 3 based on mock data length
    await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
  });

  it('toggles period between Week and Month', async () => {
    renderWithAuth(<RideHistoryPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    // Wait for content to load first
    await waitFor(() => expect(screen.getByText('Month')).toBeTruthy());
    const monthButton = screen.getByText('Month');
    fireEvent.press(monthButton);

    // Check if summary description changes to Month
    await waitFor(() => expect(screen.getByText(/Total this month/i)).toBeTruthy());
  });
});
