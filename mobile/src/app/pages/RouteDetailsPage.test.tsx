import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteDetailsPage from './RouteDetailsPage';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRouteParams = { routeId: '1' };

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

describe('RouteDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.routeId = '1';
  });

  it('renders route details for a valid route id', async () => {
    render(<RouteDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Riverside Park Loop/i)).toBeTruthy();
    });
    expect(
      screen.getByText(/A scenic route along the river with plenty of shade and flat terrain/i),
    ).toBeTruthy();
    expect(screen.getByTestId('route-details-confirm')).toBeTruthy();
  });

  it('navigates to RouteConfirmed when confirm is pressed', async () => {
    render(<RouteDetailsPage />);
    await waitFor(() => expect(screen.getByTestId('route-details-confirm')).toBeTruthy());
    fireEvent.press(screen.getByTestId('route-details-confirm'));
    expect(mockNavigate).toHaveBeenCalledWith('RouteConfirmed', { routeId: '1' });
  });

  it('shows missing state and go back for unknown route id', async () => {
    mockRouteParams.routeId = 'unknown-id';
    render(<RouteDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText('Route not found')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Go back'));
    expect(mockGoBack).toHaveBeenCalled();
    mockRouteParams.routeId = '1';
  });
});
