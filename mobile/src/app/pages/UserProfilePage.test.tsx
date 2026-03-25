import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import UserProfilePage from './UserProfilePage';
import * as userService from '../../services/userService';
import * as ImagePicker from 'expo-image-picker';

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

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  serializeUserProfile: jest.fn(() => 'profile-param'),
  uploadUserProfileAvatar: jest.fn(),
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

  it('uploads a selected image from the profile screen', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///picked-avatar.jpg' }],
    });
    (userService.uploadUserProfileAvatar as jest.Mock).mockResolvedValue(
      'https://cdn.cyclelink.example.com/profile/rider_1024/avatar.jpg'
    );

    render(<UserProfilePage />);

    const uploadButton = await screen.findByText('Upload photo');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(userService.uploadUserProfileAvatar).toHaveBeenCalledWith(
        'file:///picked-avatar.jpg'
      );
    });
  });
});
