import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RouteConfirmedPage from './RouteConfirmedPage';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('RouteConfirmedPage', () => {
  const renderPage = () =>
    render(
      <RouteConfirmedPage
        navigation={{ navigate: mockNavigate } as any}
        route={{ params: {} } as any}
      />,
    );

  it('renders the Route Confirmed title', () => {
    renderPage();
    expect(screen.getByText('Route Confirmed')).toBeTruthy();
  });

  it('renders the page content subtitle', () => {
    renderPage();
    expect(screen.getByText('Page content')).toBeTruthy();
  });
});
