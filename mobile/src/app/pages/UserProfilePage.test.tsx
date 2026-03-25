import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import UserProfilePage from './UserProfilePage';
import * as userService from '../../services/userService';

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

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  serializeUserProfile: jest.fn(() => 'profile-param'),
}));

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  it('navigates to edit profile and does not show an upload action', async () => {
    render(<UserProfilePage />);

    expect(await screen.findByText('Edit profile')).toBeTruthy();
    expect(screen.queryByText('Upload photo')).toBeNull();

    fireEvent.press(screen.getByText('Edit profile'));
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile', { profile: 'profile-param' });
  });
});
