import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import EditProfilePage from '../EditProfilePage';
import { getUserProfile, parseUserProfileParam, updateUserProfile } from '../../services/userService';

const mockBack = jest.fn();

const mockProfile = {
  userId: 'rider_1024',
  fullName: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  location: 'San Francisco, CA',
  memberSince: 'January 2025',
  cyclingPreference: 'Leisure' as const,
  weeklyGoalKm: 80,
  bio: 'Weekend rider focused on scenic waterfront routes.',
  avatarColor: '#1D4ED8',
  stats: {
    totalRides: 47,
    totalDistanceKm: 385.6,
    favoriteTrails: 28,
  },
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: jest.fn(() => ({
    profile: 'serialized-profile',
  })),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  parseUserProfileParam: jest.fn(),
  updateUserProfile: jest.fn(),
}));

const mockedGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>;
const mockedParseUserProfileParam =
  parseUserProfileParam as jest.MockedFunction<typeof parseUserProfileParam>;
const mockedUpdateUserProfile = updateUserProfile as jest.MockedFunction<typeof updateUserProfile>;

describe('EditProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedParseUserProfileParam.mockReturnValue(mockProfile);
    mockedGetUserProfile.mockResolvedValue(mockProfile);
    mockedUpdateUserProfile.mockResolvedValue(mockProfile);
  });

  it('renders with initial data populated in the input fields', async () => {
    render(<EditProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex Johnson')).toBeTruthy();
    });

    expect(screen.getByDisplayValue('alex.johnson@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('San Francisco, CA')).toBeTruthy();
    expect(screen.getByDisplayValue('Weekend rider focused on scenic waterfront routes.')).toBeTruthy();
    expect(screen.getByDisplayValue('80')).toBeTruthy();
    expect(mockedParseUserProfileParam).toHaveBeenCalledWith('serialized-profile');
  });

  it('calls updateUserProfile with the edited local state and navigates back on save', async () => {
    render(<EditProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex Johnson')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByDisplayValue('Alex Johnson'), 'Jamie Rivera');
    fireEvent.changeText(screen.getByDisplayValue('San Francisco, CA'), 'Seattle, WA');
    fireEvent.changeText(
      screen.getByDisplayValue('Weekend rider focused on scenic waterfront routes.'),
      'Commutes on weekdays and explores long scenic climbs on weekends.'
    );
    fireEvent.changeText(screen.getByDisplayValue('80'), '120');

    fireEvent.press(screen.getByText('Performance'));
    fireEvent.press(screen.getByText('Save changes'));

    await waitFor(() => {
      expect(mockedUpdateUserProfile).toHaveBeenCalledWith({
        ...mockProfile,
        fullName: 'Jamie Rivera',
        location: 'Seattle, WA',
        cyclingPreference: 'Performance',
        weeklyGoalKm: 120,
        bio: 'Commutes on weekdays and explores long scenic climbs on weekends.',
      });
    });

    await waitFor(() => {
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});
