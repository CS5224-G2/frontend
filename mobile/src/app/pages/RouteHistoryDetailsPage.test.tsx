import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteHistoryDetailsPage from './RouteHistoryDetailsPage';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockGetRideById = jest.fn();

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(View, props),
    FontAwesome5: (props: any) => React.createElement(View, props),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: any) => React.createElement(View, props);
  const MockMarker = (props: any) => React.createElement(View, props);
  const MockPolyline = (props: any) => React.createElement(View, props);

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
  };
});

jest.mock('../../services/rideService', () => ({
  getRideById: (...args: unknown[]) => mockGetRideById(...args),
}));

describe('RouteHistoryDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <RouteHistoryDetailsPage
        navigation={{ navigate: mockNavigate, goBack: mockGoBack } as any}
        route={{ params: { rideId: 'ride-1' } } as any}
      />,
    );

  it('renders ride route details when ride data is found', async () => {
    mockGetRideById.mockResolvedValue({
      id: 'ride-1',
      routeId: 'route-1',
      routeName: 'City Breeze Connector',
      completionDate: 'March 29, 2026',
      completionTime: '8:15 AM',
      startTime: '7:30 AM',
      endTime: '8:15 AM',
      totalTime: 45,
      distance: 12.4,
      avgSpeed: 16.5,
      checkpoints: 2,
      userRating: 5,
      userReview: 'Great route.',
      visitedCheckpoints: [
        { id: 'cp-1', name: 'Marina Barrage', lat: 1.28, lng: 103.87, description: 'Scenic checkpoint' },
      ],
      pointsOfInterestVisited: [
        { name: 'Lau Pa Sat Hawker Centre', description: 'Popular stop', lat: 1.2846, lng: 103.8498 },
      ],
      routeDetails: {
        id: 'route-1',
        name: 'City Breeze Connector',
        description: 'Balanced city ride with park connectors and moderate shade.',
        distance: 12.4,
        elevation: 120,
        estimatedTime: 42,
        rating: 4.6,
        reviewCount: 320,
        startPoint: { lat: 1.2837, lng: 103.8515, name: 'Raffles Place MRT' },
        endPoint: { lat: 1.3025, lng: 103.9128, name: 'East Coast Park' },
        checkpoints: [
          { id: 'cp-1', name: 'Marina Barrage', lat: 1.28, lng: 103.87, description: 'Scenic checkpoint' },
        ],
        routePath: [
          { lat: 1.2837, lng: 103.8515 },
          { lat: 1.3025, lng: 103.9128 },
        ],
        cyclistType: 'recreational',
        shade: 70,
        airQuality: 85,
      },
    });

    renderPage();

    expect(await screen.findByText('City Breeze Connector')).toBeTruthy();
    expect(screen.getByText('Route Map')).toBeTruthy();
    expect(screen.getByText('Ride Completed')).toBeTruthy();
    expect(screen.getByText('Lau Pa Sat Hawker Centre - Popular stop')).toBeTruthy();
  });

  it('shows not found state when ride does not exist', async () => {
    mockGetRideById.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText('Ride not found')).toBeTruthy();
    fireEvent.press(screen.getByText('Go Back'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('navigates to route details when Ride This Route Again is pressed', async () => {
    mockGetRideById.mockResolvedValue({
      id: 'ride-1',
      routeId: 'route-1',
      routeName: 'City Breeze Connector',
      completionDate: 'March 29, 2026',
      completionTime: '8:15 AM',
      totalTime: 45,
      distance: 12.4,
      avgSpeed: 16.5,
      checkpoints: 2,
      routeDetails: {
        id: 'route-1',
        name: 'City Breeze Connector',
        description: 'Balanced city ride with park connectors and moderate shade.',
        distance: 12.4,
        elevation: 120,
        estimatedTime: 42,
        rating: 4.6,
        reviewCount: 320,
        startPoint: { lat: 1.2837, lng: 103.8515, name: 'Raffles Place MRT' },
        endPoint: { lat: 1.3025, lng: 103.9128, name: 'East Coast Park' },
        checkpoints: [],
        cyclistType: 'recreational',
        shade: 70,
        airQuality: 85,
      },
    });

    renderPage();

    const actionButton = await screen.findByText('Ride This Route Again');
    fireEvent.press(actionButton);

    expect(mockNavigate).toHaveBeenCalledWith('HomeTab', {
      screen: 'RouteDetails',
      params: { routeId: 'route-1' },
    });
  });
});
