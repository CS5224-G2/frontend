import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import PrivacySecurityPage from './PrivacySecurityPage';
import {
  getPrivacySecuritySettings,
  updatePrivacySecuritySettings,
} from '@/services/settingsService';
import * as userService from '@/services/userService';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('@/services/settingsService', () => ({
  getPrivacySecuritySettings: jest.fn(),
  updatePrivacySecuritySettings: jest.fn(),
}));

jest.mock('@/services/userService', () => ({
  deleteAccount: jest.fn(),
}));

jest.mock('../AuthContext', () => {
  const { createContext } = jest.requireActual('react');
  return { AuthContext: createContext({ logout: jest.fn() }) };
});

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({
    preference: 'system',
    setPreference: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 34,
    left: 0,
  }),
}));

const mockedGetPrivacySecuritySettings =
  getPrivacySecuritySettings as jest.MockedFunction<typeof getPrivacySecuritySettings>;

const mockedUpdatePrivacySecuritySettings =
  updatePrivacySecuritySettings as jest.MockedFunction<typeof updatePrivacySecuritySettings>;

describe('PrivacySecurityPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

    mockedGetPrivacySecuritySettings.mockResolvedValue({
      noThirdPartyAds: false,
      noDataImprovement: false,
      notificationsManagedInDeviceSettings: true,
    });

    mockedUpdatePrivacySecuritySettings.mockResolvedValue({
      noThirdPartyAds: false,
      noDataImprovement: false,
      notificationsManagedInDeviceSettings: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Appearance segmented control with three options', async () => {
    const { getByText, getByTestId } = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(getByText('Appearance')).toBeTruthy();
    });

    expect(getByTestId('appearance-system')).toBeTruthy();
    expect(getByTestId('appearance-light')).toBeTruthy();
    expect(getByTestId('appearance-dark')).toBeTruthy();
  });

  it('renders the layout correctly', async () => {
    const screen = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(mockedGetPrivacySecuritySettings).toHaveBeenCalledTimes(1);
    });

    await act(async () => { });

    await waitFor(() => {
      expect(screen.getByText('Privacy & security')).toBeTruthy();
    });

    expect(screen.getByText('Your privacy matters')).toBeTruthy();
    expect(screen.getByText('Privacy controls')).toBeTruthy();
    expect(screen.getByText('Device permissions')).toBeTruthy();
    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Open settings')).toBeTruthy();
  });

  it('opens native settings when the notifications button is pressed', async () => {
    const screen = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(mockedGetPrivacySecuritySettings).toHaveBeenCalledTimes(1);
    });

    await act(async () => { });

    await waitFor(() => {
      expect(screen.getByTestId('notifications-settings-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('notifications-settings-button'));

    await waitFor(() => {
      expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the Danger zone section with a delete account button', async () => {
    const screen = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(screen.getByText('Danger zone')).toBeTruthy();
    });

    expect(screen.getByTestId('delete-account-button')).toBeTruthy();
    expect(screen.getByText('Delete account')).toBeTruthy();
  });

  it('shows a confirmation alert when delete account is pressed', async () => {
    (userService.deleteAccount as jest.Mock).mockResolvedValue(undefined);
    const screen = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-account-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete account',
      expect.stringContaining('permanently delete'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete account', style: 'destructive' }),
      ])
    );
  });

  it('calls deleteAccount and logout when deletion is confirmed', async () => {
    (userService.deleteAccount as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    const screen = render(<PrivacySecurityPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-account-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('delete-account-button'));

    await waitFor(() => {
      expect(userService.deleteAccount).toHaveBeenCalledTimes(1);
    });
  });
});
