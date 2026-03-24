import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterPage from './RegisterPage';
import EditProfilePage from './EditProfilePage';
import ChangePasswordPage from './ChangePasswordPage';
import * as authService from '../../services/authService';
import * as userService from '@/services/userService';
import * as settingsService from '@/services/settingsService';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: { profile?: string } = {};

jest.mock('expo-router', () => ({
    Stack: {
        Screen: () => null,
    },
    useRouter: () => ({
        replace: mockReplace,
        push: mockPush,
        back: mockBack,
    }),
    useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('../services/authService', () => ({
    ...jest.requireActual('../services/authService'),
    registerUser: jest.fn(),
}));

jest.mock('@/services/userService', () => ({
    ...jest.requireActual('@/services/userService'),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
}));

jest.mock('@/services/settingsService', () => ({
    ...jest.requireActual('@/services/settingsService'),
    updatePassword: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');

    return {
        SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    };
});

const mockedRegisterUser = authService.registerUser as jest.MockedFunction<
    typeof authService.registerUser
>;
const mockedGetUserProfile = userService.getUserProfile as jest.MockedFunction<
    typeof userService.getUserProfile
>;
const mockedUpdateUserProfile = userService.updateUserProfile as jest.MockedFunction<
    typeof userService.updateUserProfile
>;
const mockedUpdatePassword = settingsService.updatePassword as jest.MockedFunction<
    typeof settingsService.updatePassword
>;

const baseProfile: userService.UserProfile = {
    userId: 'rider_1024',
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    location: 'San Francisco, CA',
    memberSince: 'January 2025',
    cyclingPreference: 'Leisure',
    weeklyGoalKm: 80,
    bio: 'Weekend rider.',
    avatarColor: '#1D4ED8',
    stats: {
        totalRides: 47,
        totalDistanceKm: 385.6,
        favoriteTrails: 28,
    },
};

const encodeProfileParam = (profile: userService.UserProfile) =>
    encodeURIComponent(JSON.stringify(profile));

describe('Frontend security and boundary flows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSearchParams = {};

        jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

        mockedRegisterUser.mockResolvedValue({
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600,
            requestPayload: {
                first_name: 'Alex',
                last_name: 'Tan',
                email: 'alex@example.com',
                password: 'Password123',
                confirm_password: 'Password123',
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

        mockedGetUserProfile.mockResolvedValue(baseProfile);
        mockedUpdateUserProfile.mockImplementation(async (profile) => profile);
        mockedUpdatePassword.mockResolvedValue({
            status: 'ok',
            message: 'Password updated successfully.',
            updated_at: '2026-03-21T00:00:00.000Z',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('passes XSS and SQLi-style RegisterPage inputs through to the mocked middleware without crashing', async () => {
        const xssPayload = '<script>alert(1)</script>';
        const sqliPayload = "' OR '1'='1";
        const javascriptUriPayload = 'javascript:void(0)';

        render(<RegisterPage />);

        // Drive the screen exactly like a hostile user would: type suspicious content into
        // visible fields rather than calling internal handlers directly.
        fireEvent.changeText(screen.getByPlaceholderText('Alex'), xssPayload);
        fireEvent.changeText(screen.getByPlaceholderText('Johnson'), sqliPayload);
        fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), javascriptUriPayload);
        fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'Password123');
        fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'Password123');
        fireEvent.press(screen.getByText(/I agree to the/i));
        fireEvent.press(screen.getAllByText('Create Account')[1]);

        // The client does not currently sanitize these values in the page component, so the
        // security expectation for this test is "no crash + deterministic forwarding".
        await waitFor(() => {
            expect(mockedRegisterUser).toHaveBeenCalledTimes(1);
        });

        expect(mockedRegisterUser).toHaveBeenCalledWith({
            firstName: xssPayload,
            lastName: sqliPayload,
            email: javascriptUriPayload,
            password: 'Password123',
            confirmPassword: 'Password123',
            agreedToTerms: true,
        });

        // Rendering should remain stable after submission, proving the payload did not break
        // client-side state reconciliation.
        expect(screen.getByDisplayValue(xssPayload)).toBeTruthy();
        expect(mockReplace).toHaveBeenCalledWith('/home');
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('handles a 10,000-character first-name payload on RegisterPage without breaking the form', async () => {
        const veryLongFirstName = 'A'.repeat(10_000);

        render(<RegisterPage />);

        // This simulates a paste event into the first-name field using the required
        // fireEvent.changeText API.
        fireEvent.changeText(screen.getByPlaceholderText('Alex'), veryLongFirstName);
        fireEvent.changeText(screen.getByPlaceholderText('Johnson'), 'Boundary');
        fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'boundary@example.com');
        fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'Password123');
        fireEvent.changeText(screen.getByPlaceholderText('Re-enter your password'), 'Password123');
        fireEvent.press(screen.getByText(/I agree to the/i));
        fireEvent.press(screen.getAllByText('Create Account')[1]);

        // "Graceful" for the current implementation means the field accepts the data,
        // the submit path stays alive, and the payload reaches the middleware mock.
        await waitFor(() => {
            expect(mockedRegisterUser).toHaveBeenCalledTimes(1);
        });

        expect(mockedRegisterUser).toHaveBeenCalledWith({
            firstName: veryLongFirstName,
            lastName: 'Boundary',
            email: 'boundary@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
            agreedToTerms: true,
        });
        expect(screen.getByDisplayValue(veryLongFirstName)).toBeTruthy();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('trims and forwards malicious EditProfilePage values to the mocked middleware without crashing', async () => {
        const paddedXssPayload = '  <script>alert(1)</script>  ';
        const paddedSqliPayload = "  ' OR '1'='1  ";
        const paddedJavascriptUriPayload = '  javascript:void(0)  ';

        // Feed the screen a profile param so the test mounts directly into the editable state
        // instead of relying on the async fallback loader.
        mockSearchParams = {
            profile: encodeProfileParam(baseProfile),
        };

        render(<EditProfilePage />);

        fireEvent.changeText(screen.getByPlaceholderText('Enter your full name'), paddedXssPayload);
        fireEvent.changeText(screen.getByPlaceholderText('City, State'), paddedSqliPayload);
        fireEvent.changeText(
            screen.getByPlaceholderText('Tell other riders about your style.'),
            paddedJavascriptUriPayload
        );
        fireEvent.press(screen.getByText('Save changes'));

        await waitFor(() => {
            expect(mockedUpdateUserProfile).toHaveBeenCalledTimes(1);
        });

        // EditProfilePage applies trim() before invoking the service, so the exact assertion
        // documents the boundary the UI is currently enforcing.
        expect(mockedUpdateUserProfile).toHaveBeenCalledWith({
            ...baseProfile,
            fullName: '<script>alert(1)</script>',
            location: "' OR '1'='1",
            bio: 'javascript:void(0)',
        });

        expect(screen.getByDisplayValue(paddedXssPayload)).toBeTruthy();
        expect(mockBack).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('accepts an extreme full-name value on EditProfilePage and keeps submission stable', async () => {
        const veryLongFullName = 'R'.repeat(10_000);

        // EditProfilePage exposes a single full-name field instead of separate first/last
        // name inputs, so this is the closest equivalent boundary surface on that screen.
        mockSearchParams = {
            profile: encodeProfileParam(baseProfile),
        };

        render(<EditProfilePage />);

        fireEvent.changeText(screen.getByPlaceholderText('Enter your full name'), veryLongFullName);
        fireEvent.changeText(screen.getByPlaceholderText('City, State'), 'Boundary City');
        fireEvent.changeText(
            screen.getByPlaceholderText('Tell other riders about your style.'),
            'Long payload boundary test'
        );
        fireEvent.press(screen.getByText('Save changes'));

        await waitFor(() => {
            expect(mockedUpdateUserProfile).toHaveBeenCalledTimes(1);
        });

        expect(mockedUpdateUserProfile).toHaveBeenCalledWith({
            ...baseProfile,
            fullName: veryLongFullName,
            location: 'Boundary City',
            bio: 'Long payload boundary test',
        });
        expect(screen.getByDisplayValue(veryLongFullName)).toBeTruthy();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('does not call updatePassword when confirmNewPassword mismatches, even if submit is force-pressed', () => {
        render(<ChangePasswordPage />);

        fireEvent.changeText(screen.getByPlaceholderText('Enter current password'), 'CycleLink123');
        fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPassword1');
        fireEvent.changeText(
            screen.getByPlaceholderText('Re-enter new password'),
            'DefinitelyNotTheSame1'
        );

        // The component should expose its mismatch state before submission is attempted.
        expect(screen.getByText('Confirmation must match the new password.')).toBeTruthy();

        const submitButton = screen.getByTestId('change-password-submit-button');

        // This intentionally presses the disabled submit control anyway to prove a simple
        // button click cannot bypass the matching guard in client state.
        fireEvent.press(submitButton);

        expect(mockedUpdatePassword).not.toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });
});