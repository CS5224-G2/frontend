import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditProfilePage from './EditProfilePage';
import { AuthContext } from '../AuthContext';
import * as userService from '../../services/userService';
import * as ImagePicker from 'expo-image-picker';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { profile: JSON.stringify({
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      location: 'Singapore',
      memberSince: 'January 2025',
      bio: 'Loves cycling',
      cyclingPreference: 'Leisure',
      weeklyGoalKm: 50,
      avatarUrl: null,
      avatarColor: '#000000'
    })},
  }),
}));

jest.mock('../../services/userService', () => ({
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  deleteUserProfileAvatar: jest.fn(),
  uploadUserProfileAvatar: jest.fn(),
  parseUserProfileParam: jest.requireActual('../../services/userService').parseUserProfileParam,
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(View, props),
  };
});

describe('EditProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('renders correctly with profile data', async () => {
    renderWithAuth(<EditProfilePage />);

    expect(await screen.findByDisplayValue('John Doe')).toBeTruthy();
    expect(screen.getByDisplayValue('Singapore')).toBeTruthy();
    expect(screen.getByText('Cycling preference')).toBeTruthy();
  });

  it('calls updateProfile and goes back when save is pressed', async () => {
    const mockUpdate = userService.updateUserProfile as jest.Mock;
    mockUpdate.mockResolvedValueOnce({ success: true });

    renderWithAuth(<EditProfilePage />);
    
    const saveButton = await screen.findByText(/Save changes/i);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('cancels and goes back', async () => {
    renderWithAuth(<EditProfilePage />);
    
    const cancelButton = await screen.findByText(/Cancel/i);
    fireEvent.press(cancelButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('uploads a selected image from the avatar button', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      buttons?.find((button) => button.text === 'Upload photo')?.onPress?.();
    });
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

    renderWithAuth(<EditProfilePage />);

    const avatarButton = await screen.findByTestId('edit-profile-avatar-button');
    fireEvent.press(avatarButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(userService.uploadUserProfileAvatar).toHaveBeenCalledWith(
        'file:///picked-avatar.jpg'
      );
    });
  });

  it('removes the avatar from the action menu', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      buttons?.find((button) => button.text === 'Remove avatar')?.onPress?.();
    });
    (userService.deleteUserProfileAvatar as jest.Mock).mockResolvedValue(undefined);

    renderWithAuth(<EditProfilePage />);

    const avatarButton = await screen.findByTestId('edit-profile-avatar-button');
    fireEvent.press(avatarButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
      expect(userService.deleteUserProfileAvatar).toHaveBeenCalled();
    });
  });
});
