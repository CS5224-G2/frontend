import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteFeedbackPage from './RouteFeedbackPage';

const mockNavigate = jest.fn();
const mockGetRouteById = jest.fn();
const mockSubmitRideFeedback = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(View, props),
  };
});

jest.mock('../../services/routeService', () => ({
  getRouteById: (...args: unknown[]) => mockGetRouteById(...args),
}));

jest.mock('../../services/rideService', () => ({
  submitRideFeedback: (...args: unknown[]) => mockSubmitRideFeedback(...args),
}));

const mockRoute = {
  id: '1',
  name: 'East Coast Park Trail',
  description: 'Beachside cycling with sea views',
  distance: 12.0,
  elevation: 10,
  estimatedTime: 45,
  rating: 4.9,
  reviewCount: 456,
  startPoint: { lat: 1.30, lng: 103.91, name: 'ECP Start' },
  endPoint: { lat: 1.30, lng: 103.93, name: 'ECP End' },
  checkpoints: [],
  cyclistType: 'commuter',
  shade: 50,
  airQuality: 90,
};

describe('RouteFeedbackPage', () => {
  const renderPage = (routeId = '1') =>
    render(
      <RouteFeedbackPage
        navigation={{ navigate: mockNavigate } as any}
        route={{ params: { routeId } } as any}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRouteById.mockResolvedValue(mockRoute);
    mockSubmitRideFeedback.mockResolvedValue(undefined);
  });

  it('renders the page heading after loading', async () => {
    renderPage();
    expect(await screen.findByText('Rate Your Experience')).toBeTruthy();
  }, 10000);

  it('shows the route name in the subtitle', async () => {
    renderPage();
    expect(await screen.findByText(/How was your ride on East Coast Park Trail/)).toBeTruthy();
  }, 10000);

  it('renders the Your Rating label', async () => {
    renderPage();
    expect(await screen.findByText('Your Rating')).toBeTruthy();
  }, 10000);

  it('renders the Submit Feedback button', async () => {
    renderPage();
    expect(await screen.findByText('Submit Feedback')).toBeTruthy();
  }, 10000);

  it('shows the rating hint when no star is selected', async () => {
    renderPage();
    expect(await screen.findByText('Please select a rating to continue')).toBeTruthy();
  }, 10000);

  it('shows the route summary section', async () => {
    renderPage();
    expect(await screen.findByText('Route Summary')).toBeTruthy();
    expect(screen.getByText('12 km')).toBeTruthy();
    expect(screen.getByText('45 minutes')).toBeTruthy();
  }, 10000);

  it('shows the written feedback text input', async () => {
    renderPage();
    expect(
      await screen.findByPlaceholderText('Tell us about your experience on this route...'),
    ).toBeTruthy();
  }, 10000);

  it('renders the route not found state when getRouteById returns null', async () => {
    mockGetRouteById.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByText('Route not found')).toBeTruthy();
  }, 10000);

  it('navigates to HomePage from route not found state', async () => {
    mockGetRouteById.mockResolvedValue(null);
    renderPage();
    const backButton = await screen.findByText('Back to Home');
    fireEvent.press(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('HomePage');
  }, 10000);

  it('shows Additional Comments field after page loads', async () => {
    renderPage();
    expect(await screen.findByText('Additional Comments (Optional)')).toBeTruthy();
  }, 10000);
});
