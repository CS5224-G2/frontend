import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingPage from './OnboardingPage';
import { AuthContext } from '../AuthContext';
import * as userService from '../../services/userService';
import * as Location from 'expo-location';

const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('../../services/secureSession', () => ({
  loadSession: jest.fn().mockResolvedValue({
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    expiresIn: 3600,
    user: {
      id: 'user_001',
      firstName: 'Alex',
      lastName: 'Tan',
      fullName: 'Alex Tan',
      email: 'alex@example.com',
      onboardingComplete: false,
      role: 'user',
    },
  }),
}));

jest.mock('../../services/userService', () => ({
  updateUserProfile: jest.fn().mockResolvedValue({}),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 1.3521, longitude: 103.8198 } }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ district: 'Tampines', city: 'Singapore' }]),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const renderWithAuth = async (component: React.ReactElement) => {
  const result = render(
    <AuthContext.Provider
      value={{
        isRestoring: false,
        isLoggedIn: false,
        role: null,
        user: null,
        login: mockLogin,
        logout: jest.fn().mockResolvedValue(undefined),
      }}
    >
      {component}
    </AuthContext.Provider>,
  );
  await act(async () => {});
  return result;
};

describe('OnboardingPage', () => {
  const mockedUpdateUserProfile = userService.updateUserProfile as jest.MockedFunction<
    typeof userService.updateUserProfile
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockedUpdateUserProfile.mockResolvedValue({} as any);
  });

  it('renders all onboarding fields', async () => {
    await renderWithAuth(<OnboardingPage />);
    expect(screen.getByPlaceholderText('Neighbourhood, Singapore')).toBeTruthy();
    expect(screen.getByText('Leisure')).toBeTruthy();
    expect(screen.getByText('Commuter')).toBeTruthy();
    expect(screen.getByText('Performance')).toBeTruthy();
    expect(screen.getByPlaceholderText('80')).toBeTruthy();
    expect(screen.getByPlaceholderText("Tell other riders about your style...")).toBeTruthy();
    expect(screen.getByText('Get Started')).toBeTruthy();
  });

  it('fills location field when Use Current Location is pressed and permission is granted', async () => {
    await renderWithAuth(<OnboardingPage />);
    fireEvent.press(screen.getByText('Use Current Location'));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tampines, Singapore')).toBeTruthy();
    });
  });

  it('shows alert if Get Started pressed with empty location', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    await renderWithAuth(<OnboardingPage />);
    fireEvent.press(screen.getByText('Performance'));
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Missing location', expect.any(String));
    });
  });

  it('shows alert if Get Started pressed with no cycling preference selected', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    await renderWithAuth(<OnboardingPage />);
    fireEvent.changeText(screen.getByPlaceholderText('Neighbourhood, Singapore'), 'Tampines, Singapore');
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Missing preference', expect.any(String));
    });
  });

  it('shows alert if Get Started pressed with invalid weekly goal', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    await renderWithAuth(<OnboardingPage />);
    fireEvent.changeText(screen.getByPlaceholderText('Neighbourhood, Singapore'), 'Tampines, Singapore');
    fireEvent.press(screen.getByText('Leisure'));
    fireEvent.changeText(screen.getByPlaceholderText('80'), '0');
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid goal', expect.any(String));
    });
  });

  it('calls updateUserProfile then login on valid submit', async () => {
    await renderWithAuth(<OnboardingPage />);

    fireEvent.changeText(screen.getByPlaceholderText('Neighbourhood, Singapore'), 'Tampines, Singapore');
    fireEvent.press(screen.getByText('Leisure'));
    fireEvent.changeText(screen.getByPlaceholderText('80'), '100');
    fireEvent.press(screen.getByText('Get Started'));

    await waitFor(() => {
      expect(mockedUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Tampines, Singapore',
          cyclingPreference: 'Leisure',
          weeklyGoalKm: 100,
          fullName: 'Alex Tan',
          email: 'alex@example.com',
        }),
        'mock-token',
      );
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'mock-token' }),
      );
    });
  });
});
