import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterPage from './RegisterPage';
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
    renderWithAuth(<RegisterPage />);

    expect(screen.getAllByText('Create Account').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Alex')).toBeTruthy();
    expect(screen.getByPlaceholderText('Johnson')).toBeTruthy();
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('calls the mocked registerUser middleware when submitted', async () => {
    renderWithAuth(<RegisterPage />);
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

  it('calls login from AuthContext upon successful registration', async () => {
    renderWithAuth(<RegisterPage />);
    const submitButtonText = screen.getAllByText('Create Account')[1];

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Tan');
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'password123');

    fireEvent.press(screen.getByText(/I agree to the/i));
    fireEvent.press(submitButtonText);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});
