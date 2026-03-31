import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { AuthContext } from '@/app/AuthContext';

import ChangePasswordRoute from '../../app/change-password';
import EditProfileRoute from '../../app/edit-profile';
import HomeRoute from '../../app/home';
import PrivacySecurityRoute from '../../app/privacy-security';
import ProfileRoute from '../../app/profile';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Redirect: ({ href }: { href: string }) => <Text>{`REDIRECT:${href}`}</Text>,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  };
});

jest.mock('@/app/AuthContext', () => {
  const React = require('react');

  return {
    AuthContext: React.createContext({
      isRestoring: false,
      isLoggedIn: false,
      role: null,
      user: null,
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
    }),
  };
});

jest.mock('@/app/pages/UserProfilePage', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockUserProfilePage() {
    return <Text>PROFILE_PAGE</Text>;
  };
});

jest.mock('@/app/pages/EditProfilePage', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockEditProfilePage() {
    return <Text>EDIT_PROFILE_PAGE</Text>;
  };
});

jest.mock('@/app/pages/ChangePasswordPage', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockChangePasswordPage() {
    return <Text>CHANGE_PASSWORD_PAGE</Text>;
  };
});

jest.mock('@/app/pages/PrivacySecurityPage', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockPrivacySecurityPage() {
    return <Text>PRIVACY_SECURITY_PAGE</Text>;
  };
});

const defaultAuthValue = {
  isRestoring: false,
  isLoggedIn: false,
  role: null,
  user: null,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
};

function renderWithAuth(
  ui: React.ReactElement,
  overrides: Partial<typeof defaultAuthValue> = {},
) {
  return render(
    <AuthContext.Provider value={{ ...defaultAuthValue, ...overrides }}>
      {ui}
    </AuthContext.Provider>,
  );
}

describe('protected routes', () => {
  it.each([
    ['profile', <ProfileRoute />],
    ['edit profile', <EditProfileRoute />],
    ['change password', <ChangePasswordRoute />],
    ['privacy security', <PrivacySecurityRoute />],
    ['home', <HomeRoute />],
  ])('redirects unauthenticated users away from %s', (_label, route) => {
    renderWithAuth(route, { isLoggedIn: false, isRestoring: false });

    expect(screen.getByText('REDIRECT:/login')).toBeTruthy();
  });

  it.each([
    ['profile', <ProfileRoute />, 'PROFILE_PAGE'],
    ['edit profile', <EditProfileRoute />, 'EDIT_PROFILE_PAGE'],
    ['change password', <ChangePasswordRoute />, 'CHANGE_PASSWORD_PAGE'],
    ['privacy security', <PrivacySecurityRoute />, 'PRIVACY_SECURITY_PAGE'],
    ['home', <HomeRoute />, 'Open Profile Settings'],
  ])('renders %s only for authenticated users', (_label, route, marker) => {
    renderWithAuth(route, { isLoggedIn: true, isRestoring: false });

    expect(screen.queryByText('REDIRECT:/login')).toBeNull();
    expect(screen.getByText(marker)).toBeTruthy();
  });

  it('does not render protected content while auth restoration is in progress', () => {
    renderWithAuth(<ProfileRoute />, { isLoggedIn: false, isRestoring: true });

    expect(screen.queryByText('REDIRECT:/login')).toBeNull();
    expect(screen.queryByText('PROFILE_PAGE')).toBeNull();
  });
});
