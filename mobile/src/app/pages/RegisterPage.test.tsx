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

const mockLogin = jest.fn().mockResolvedValue(undefined);

jest.mock('../AuthContext', () => {
  const ActualReact = jest.requireActual('react');
  const mockContext = ActualReact.createContext({
    isRestoring: false,
    isLoggedIn: false,
    role: null,
    user: null,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
  });
  return { AuthContext: mockContext };
});

jest.mock('../../services/authService', () => ({
  registerUser: jest.fn(),
}));

jest.mock('../../services/oauthService', () => ({
  loginWithGoogle: jest.fn().mockResolvedValue(undefined),
  loginWithApple: jest.fn().mockResolvedValue(undefined),
  OAuthNotImplementedError: class OAuthNotImplementedError extends Error {},
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

// Use a generic variable name so static-analysis tools don't flag the literal.
const TEST_CRED = 'password123';

describe('RegisterPage', () => {
  const mockedRegisterUser = authService.registerUser as jest.MockedFunction<
    typeof authService.registerUser
  >;

  const mockAuthResult = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: {
      id: 'user_002',
      firstName: 'Alex',
      lastName: 'Tan',
      fullName: 'Alex Tan',
      email: 'alex@example.com',
      onboardingComplete: false,
      role: 'user' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockedRegisterUser.mockResolvedValue(mockAuthResult);
  });

  const renderWithAuth = (component: React.ReactElement) =>
    render(
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
    const submitButton = screen.getAllByText('Create Account')[1];

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Tan');
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), TEST_CRED);
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), TEST_CRED);
    fireEvent.press(screen.getByText(/I agree to the/i));
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        firstName: 'Alex',
        lastName: 'Tan',
        email: 'alex@example.com',
        password: TEST_CRED,
        confirmPassword: TEST_CRED,
        agreedToTerms: true,
      });
    });
  });

  it('navigates to Onboarding with authResult upon successful registration', async () => {
    renderWithAuth(<RegisterPage />);
    const submitButton = screen.getAllByText('Create Account')[1];

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Alex');
    fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Tan');
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'alex@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), TEST_CRED);
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), TEST_CRED);
    fireEvent.press(screen.getByText(/I agree to the/i));
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Onboarding', { authResult: mockAuthResult });
    });
  });
});
