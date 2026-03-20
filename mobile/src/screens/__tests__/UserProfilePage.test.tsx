import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

import UserProfilePage from '../UserProfilePage';
import { getUserProfile } from '../../services/userService';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  serializeUserProfile: jest.fn(() => 'serialized-profile'),
}));

const mockedGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getUserProfile on mount and renders the returned profile data', async () => {
    mockedGetUserProfile.mockResolvedValue({
      userId: 'rider_1024',
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      location: 'San Francisco, CA',
      memberSince: 'January 2025',
      cyclingPreference: 'Leisure',
      weeklyGoalKm: 80,
      bio: 'Weekend rider focused on scenic waterfront routes.',
      avatarColor: '#1D4ED8',
      stats: {
        totalRides: 47,
        totalDistanceKm: 385.6,
        favoriteTrails: 28,
      },
    });

    render(<UserProfilePage />);

    expect(screen.getByText('Loading your profile')).toBeTruthy();
    expect(mockedGetUserProfile).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Alex Johnson')).toBeTruthy();
    });

    expect(screen.getByText('alex.johnson@example.com')).toBeTruthy();
    expect(screen.getByText('San Francisco, CA')).toBeTruthy();
    expect(screen.getByText('Member since January 2025')).toBeTruthy();
    expect(screen.getByText('Leisure')).toBeTruthy();
    expect(screen.getByText('Weekly goal: 80 km')).toBeTruthy();
    expect(screen.getByText('385.6 km')).toBeTruthy();
    expect(screen.getByText('47')).toBeTruthy();
    expect(screen.getByText('28')).toBeTruthy();
  });
});
