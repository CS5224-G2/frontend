import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterPage from './RegisterPage';
import * as authService from '../services/authService';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock('../services/authService', () => ({
  registerUser: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('RegisterPage', () => {
  const mockedRegisterUser = authService.registerUser as jest.MockedFunction<
    typeof authService.registerUser
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedRegisterUser.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      requestPayload: {
        first_name: 'Alex',
        last_name: 'Tan',
        email: 'alex@example.com',
        password: 'password123',
        confirm_password: 'password123',
        agreed_to_terms: true,
        client: 'mobile_app',
      },
      user: {
        id: 'user_002',
        firstName: 'Alex',
        lastName: 'Tan',
        fullName: 'Alex Tan',
        email: 'alex@example.com',
        onboardingComplete: false,
      },
    });
  });

  it('renders correctly', () => {
    render(<RegisterPage />);

    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Alex')).toBeTruthy();
    expect(screen.getByPlaceholderText('Johnson')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('calls the mocked registerUser middleware when submitted', async () => {
    render(<RegisterPage />);
    const submitButtonText = screen.getAllByText('Create Account')[1];

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Tan');
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    fireEvent.press(screen.getByText(/I agree to the/i));
    fireEvent.press(submitButtonText);

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        firstName: 'Alex',
        lastName: 'Tan',
        email: 'alex@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        agreedToTerms: true,
      });
    });
  });
});
