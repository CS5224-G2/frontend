import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginPage from './LoginPage';
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
  loginUser: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('LoginPage', () => {
  const mockedLoginUser = authService.loginUser as jest.MockedFunction<typeof authService.loginUser>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedLoginUser.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      requestPayload: {
        email: 'alex@example.com',
        password: 'password123',
        remember_me: false,
        client: 'mobile_app',
      },
      user: {
        id: 'user_001',
        firstName: 'Alex',
        lastName: 'Rider',
        fullName: 'Alex Rider',
        email: 'alex@example.com',
        onboardingComplete: true,
      },
    });
  });

  it('renders correctly', () => {
    render(<LoginPage />);

    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('updates state when text is typed into the inputs', () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(emailInput, 'alex@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(screen.getByDisplayValue('alex@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('password123')).toBeTruthy();
  });

  it('calls the mocked loginUser middleware with the correct payload when submitted', async () => {
    render(<LoginPage />);
    const submitButtonText = screen.getAllByText('Sign In')[1];

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(submitButtonText);

    await waitFor(() => {
      expect(mockedLoginUser).toHaveBeenCalledWith({
        email: 'alex@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
  });

  it('navigates to the home screen upon successful login', async () => {
    render(<LoginPage />);
    const submitButtonText = screen.getAllByText('Sign In')[1];

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(submitButtonText);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });
  });
});
