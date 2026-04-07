import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ResetPasswordPage from './ResetPasswordPage';
import { resetPassword } from '@/services/authService';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

jest.mock('@/services/authService', () => ({
  resetPassword: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

const mockedResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    mockedResetPassword.mockResolvedValue('Password reset successful.');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows validation feedback and prevents submission when passwords do not match', () => {
    const screen = render(<ResetPasswordPage />);

    fireEvent.changeText(screen.getByPlaceholderText('Paste the token from your email'), 'token-123');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPassword1');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter new password'), 'MismatchPassword1');

    expect(screen.getByText('Confirmation must match the new password.')).toBeTruthy();

    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it('calls resetPassword and routes back to sign in after success', async () => {
    const screen = render(<ResetPasswordPage />);

    fireEvent.changeText(screen.getByPlaceholderText('Paste the token from your email'), 'token-123');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPassword1');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter new password'), 'NewPassword1');

    fireEvent.press(screen.getByTestId('reset-password-submit-button'));

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledWith('token-123', 'NewPassword1');
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Password reset',
      'Password reset successful.',
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Back to sign in',
          onPress: expect.any(Function),
        }),
      ]),
    );

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{ onPress?: () => void }>;
    buttons[0]?.onPress?.();
    expect(mockNavigate).toHaveBeenCalledWith('login');
  });
});
