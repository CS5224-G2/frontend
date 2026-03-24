import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginPage from './LoginPage';
import { AuthContext } from '../AuthContext';
import * as authService from '../../services/authService';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockLogin = jest.fn();

jest.mock('../AuthContext', () => {
  const React = require('react');
  const ActualReact = jest.requireActual('react');
  const mockContext = ActualReact.createContext({
    login: jest.fn(),
    logout: jest.fn(),
    isLoggedIn: false,
  });
  return {
    AuthContext: mockContext,
  };
});

jest.mock('../../services/authService', () => ({
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
    } as any);
  });

  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={{ login: mockLogin, logout: jest.fn(), isLoggedIn: false }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('renders correctly', () => {
    renderWithAuth(<LoginPage />);

    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('updates state when text is typed into the inputs', () => {
    renderWithAuth(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(emailInput, 'alex@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(screen.getByDisplayValue('alex@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('password123')).toBeTruthy();
  });

  it('calls the mocked loginUser middleware with the correct payload when submitted', async () => {
    renderWithAuth(<LoginPage />);
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

  it('calls login from AuthContext upon successful login', async () => {
    renderWithAuth(<LoginPage />);
    const submitButtonText = screen.getAllByText('Sign In')[1];

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'password123');
    fireEvent.press(submitButtonText);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});