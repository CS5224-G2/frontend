import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ChangePasswordPage from './ChangePasswordPage';
import { updatePassword } from '@/services/settingsService';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    Stack: {
        Screen: () => null,
    },
    useRouter: () => ({
        back: mockBack,
    }),
}));

jest.mock('@/services/settingsService', () => ({
    updatePassword: jest.fn(),
}));

const mockedUpdatePassword = updatePassword as jest.MockedFunction<typeof updatePassword>;

describe('ChangePasswordPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

        mockedUpdatePassword.mockResolvedValue({
            status: 'ok',
            message: 'Password updated successfully.',
            updated_at: '2026-03-21T00:00:00.000Z',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shows validation feedback and prevents submission when passwords do not match', () => {
        const screen = render(<ChangePasswordPage />);

        fireEvent.changeText(screen.getByPlaceholderText('Enter current password'), 'OldPassword1');
        fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPassword1');
        fireEvent.changeText(screen.getByPlaceholderText('Re-enter new password'), 'MismatchPassword1');

        expect(screen.getByText('Confirmation must match the new password.')).toBeTruthy();

        fireEvent.press(screen.getByTestId('change-password-submit-button'));

        expect(mockedUpdatePassword).not.toHaveBeenCalled();
    });

    it('calls updatePassword only when passwords match and the form is submitted', async () => {
        const screen = render(<ChangePasswordPage />);

        fireEvent.changeText(screen.getByPlaceholderText('Enter current password'), 'OldPassword1');
        fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPassword1');
        fireEvent.changeText(screen.getByPlaceholderText('Re-enter new password'), 'NewPassword1');

        fireEvent.press(screen.getByTestId('change-password-submit-button'));

        await waitFor(() => {
            expect(mockedUpdatePassword).toHaveBeenCalledTimes(1);
        });

        expect(mockedUpdatePassword).toHaveBeenCalledWith({
            currentPassword: 'OldPassword1',
            newPassword: 'NewPassword1',
            confirmNewPassword: 'NewPassword1',
        });
    });
});