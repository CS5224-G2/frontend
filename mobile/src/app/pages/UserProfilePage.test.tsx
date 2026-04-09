import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import UserProfilePage from './UserProfilePage';
import * as userService from '../../services/userService';
import * as rideService from '../../services/rideService';
import { setActiveMockAccountId, setFavoriteRouteIdsLocal } from '../../services/localDb';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('nativewind', () => ({
  useColorScheme: () => ({
    colorScheme: 'light',
  }),
}));

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({
    preference: 'system',
    setPreference: jest.fn(),
  }),
}));

jest.mock('../AuthContext', () => {
  const { createContext } = jest.requireActual('react');
  return { AuthContext: createContext({ logout: jest.fn() }) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 34,
    left: 0,
  }),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  serializeUserProfile: jest.fn(() => 'profile-param'),
}));

jest.mock('../../services/rideService', () => ({
  getRideHistory: jest.fn(),
}));

describe('UserProfilePage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await setActiveMockAccountId('user-profile-test');
    await setFavoriteRouteIdsLocal(['route-1', 'route-2']);

    (userService.getUserProfile as jest.Mock).mockResolvedValue({
      userId: 'rider_1024',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      location: 'San Francisco, CA',
      memberSince: 'January 2025',
      cyclingPreference: 'Leisure',
      weeklyGoalKm: 80,
      bio: 'Weekend rider focused on scenic waterfront routes.',
      avatarUrl: null,
      avatarColor: '#1D4ED8',
      stats: {
        totalRides: 47,
        totalDistanceKm: 385.6,
        favoriteTrails: 28,
      },
    });
    (rideService.getRideHistory as jest.Mock).mockResolvedValue([
      {
        id: 'ride-1',
        routeId: 'route-1',
        routeName: 'Marina Loop',
        completionDate: 'March 10, 2026',
        completionTime: '8:00 AM',
        totalTime: 42,
        distance: 12.8,
        avgSpeed: 18.3,
        checkpoints: 4,
      },
      {
        id: 'ride-2',
        routeId: 'route-2',
        routeName: 'Park Connector',
        completionDate: 'March 12, 2026',
        completionTime: '6:30 PM',
        totalTime: 35,
        distance: 7.5,
        avgSpeed: 15.2,
        checkpoints: 3,
      },
    ]);
  });

  it('navigates to edit profile and does not show an upload action', async () => {
    render(<UserProfilePage />);

    expect(await screen.findByText('Edit profile')).toBeTruthy();
    expect(screen.queryByText('Upload photo')).toBeNull();

    fireEvent.press(screen.getByText('Edit profile'));
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile', { profile: 'profile-param' });
  });

  it('opens the profile settings screens with the existing naming convention', async () => {
    render(<UserProfilePage />);

    await screen.findByText('Edit profile');

    fireEvent.press(screen.getByText('Privacy'));
    expect(mockNavigate).toHaveBeenCalledWith('privacy-security');

    fireEvent.press(screen.getByText('Password'));
    expect(mockNavigate).toHaveBeenCalledWith('change-password');
  });

  it('shows a sign-out confirmation alert when the sign out button is pressed', async () => {
    jest.spyOn(Alert, 'alert');
    render(<UserProfilePage />);

    await screen.findByTestId('sign-out-button');
    fireEvent.press(screen.getByTestId('sign-out-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign out',
      'Are you sure you want to sign out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Sign out', style: 'destructive' }),
      ])
    );
  });

  it('shows ride and saved trail stats from live app data', async () => {
    render(<UserProfilePage />);

    expect(await screen.findByTestId('profile-stat-totalRides-value')).toHaveTextContent('2');
    expect(screen.getByTestId('profile-stat-totalDistanceKm-value')).toHaveTextContent('20.3 km');
    expect(screen.getByTestId('profile-stat-favoriteTrails-value')).toHaveTextContent('2');
  });
});
