import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import PrivacySecurityPage from './PrivacySecurityPage';
import {
  getPrivacySecuritySettings,
  updatePrivacySecuritySettings,
} from '@/services/settingsService';

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
});
