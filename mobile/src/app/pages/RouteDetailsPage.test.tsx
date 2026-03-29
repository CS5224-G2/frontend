import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import RouteDetailsPage from './RouteDetailsPage';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('RouteDetailsPage', () => {
  const renderPage = () =>
    render(
      <RouteDetailsPage
        navigation={{ navigate: mockNavigate } as any}
        route={{ params: {} } as any}
      />,
    );

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the Route Details heading', () => {
    renderPage();
    expect(screen.getByText('Route Details')).toBeTruthy();
  });

  it('renders the page content text', () => {
    renderPage();
    expect(screen.getByText('Page content')).toBeTruthy();
  });

  it('renders the Route Feedback button', () => {
    renderPage();
    expect(screen.getByText('Route Feedback')).toBeTruthy();
  });

  it('navigates to RouteFeedback when Route Feedback button is pressed', () => {
    renderPage();
    fireEvent.press(screen.getByText('Route Feedback'));
    expect(mockNavigate).toHaveBeenCalledWith('RouteFeedback');
  });
});
