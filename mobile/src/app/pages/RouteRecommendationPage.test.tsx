import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteRecommendationPage from './RouteRecommendationPage';

const mockNavigate = jest.fn();
const mockGetRoutes = jest.fn();
const mockGetRouteRecommendations = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => React.createElement(View, props),
    AntDesign: (props: any) => React.createElement(View, props),
  };
});

// All mock data inside factory to avoid jest.mock hoisting issues
jest.mock('../../services/routeService', () => ({
  getRoutes: (...args: unknown[]) => mockGetRoutes(...args),
  getRouteRecommendations: (...args: unknown[]) => mockGetRouteRecommendations(...args),
}));

const mockRoutes = [
  {
    id: '1',
    name: 'Jurong Lake Loop',
    description: 'Scenic lakeside cycling route',
    distance: 8.5,
    elevation: 20,
    estimatedTime: 30,
    rating: 4.7,
    reviewCount: 123,
    startPoint: { lat: 1.34, lng: 103.72, name: 'Jurong East MRT' },
    endPoint: { lat: 1.34, lng: 103.72, name: 'Jurong East MRT' },
    checkpoints: [],
    cyclistType: 'recreational',
    shade: 70,
    airQuality: 80,
  },
  {
    id: '2',
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
  },
  {
    id: '3',
    name: 'Changi Coastal Route',
    description: 'Eastern coastal path',
    distance: 15.0,
    elevation: 15,
    estimatedTime: 55,
    rating: 4.6,
    reviewCount: 89,
    startPoint: { lat: 1.38, lng: 103.97, name: 'Changi Village' },
    endPoint: { lat: 1.37, lng: 103.98, name: 'Changi Point' },
    checkpoints: [],
    cyclistType: 'fitness',
    shade: 40,
    airQuality: 85,
  },
];

describe('RouteRecommendationPage', () => {
  const renderPage = () =>
    render(
      <RouteRecommendationPage
        navigation={{ navigate: mockNavigate } as any}
        route={{} as any}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValue(null);
    mockGetRoutes.mockResolvedValue(mockRoutes);
    mockGetRouteRecommendations.mockResolvedValue(mockRoutes);
  });

  it('renders the page heading after loading', async () => {
    renderPage();
    expect(await screen.findByTestId('route-list-heading')).toHaveTextContent('Route Recommendations');
  }, 10000);

  it('shows route cards after data loads', async () => {
    renderPage();
    expect(await screen.findByText('Jurong Lake Loop')).toBeTruthy();
    expect(screen.getByText('East Coast Park Trail')).toBeTruthy();
  }, 10000);

  it('displays route distance and time', async () => {
    renderPage();
    expect(await screen.findByText(/8\.5/)).toBeTruthy();
  }, 10000);

  it('displays the routes found count', async () => {
    renderPage();
    expect(await screen.findByText(/routes found/i)).toBeTruthy();
  }, 10000);

  it('navigates to RouteDetails when a route card is pressed', async () => {
    renderPage();
    await screen.findByTestId('route-list-item-1');
    fireEvent.press(screen.getByText('Jurong Lake Loop'));
    expect(mockNavigate).toHaveBeenCalledWith('RouteDetails', { routeId: '1' });
  }, 10000);

  it('shows a collapsed mock request dropdown when a saved request exists', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, source: 'search' },
      endPoint: { name: 'Sentosa', lat: 1.2494, lng: 103.8303, source: 'map' },
      checkpoints: [],
      preferences: {
        cyclistType: 'commuter',
        preferredShade: 60,
        elevation: 40,
        distance: 15,
        airQuality: 70,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedRequest));

    renderPage();

    expect(await screen.findByText('API Request')).toBeTruthy();
    expect(screen.getByText('Show request details')).toBeTruthy();
    expect(screen.queryByText('Marina Bay Sands')).toBeNull();
  }, 10000);

  it('expands mock request dropdown to show details when pressed', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, source: 'search' },
      endPoint: { name: 'Sentosa', lat: 1.2494, lng: 103.8303, source: 'map' },
      checkpoints: [],
      preferences: {
        cyclistType: 'commuter',
        preferredShade: 60,
        elevation: 40,
        distance: 15,
        airQuality: 70,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedRequest));

    renderPage();

    const toggle = await screen.findByText('Show request details');
    fireEvent.press(toggle);

    expect(await screen.findByText('Marina Bay Sands')).toBeTruthy();
    expect(screen.getByText('Sentosa')).toBeTruthy();
    expect(screen.getByText('Hide request details')).toBeTruthy();
  }, 10000);

  it('uses getRouteRecommendations when preferences are present', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Start', lat: 1.3, lng: 103.8, source: 'search' },
      endPoint: { name: 'End', lat: 1.31, lng: 103.81, source: 'search' },
      checkpoints: [],
      preferences: {
        cyclistType: 'recreational',
        preferredShade: 50,
        elevation: 50,
        distance: 10,
        airQuality: 50,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedRequest));

    renderPage();

    expect(await screen.findByText('Jurong Lake Loop')).toBeTruthy();
    expect(mockGetRouteRecommendations).toHaveBeenCalled();
  }, 10000);

  it('falls back to getRoutes when no saved request exists', async () => {
    renderPage();
    expect(await screen.findByText('Jurong Lake Loop')).toBeTruthy();
    expect(mockGetRoutes).toHaveBeenCalled();
  }, 10000);

  it('renders contract-style recommendation fields from POST /routes/recommendations output', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Start', lat: 1.3, lng: 103.8, source: 'search' },
      endPoint: { name: 'End', lat: 1.31, lng: 103.81, source: 'current-location' },
      checkpoints: [],
      preferences: {
        cyclistType: 'recreational',
        preferredShade: 50,
        elevation: 50,
        distance: 10,
        airQuality: 50,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedRequest));

    mockGetRouteRecommendations.mockResolvedValue([
      {
        id: 'route_001',
        name: 'City Breeze Connector',
        description: 'Balanced city ride with park connectors and moderate shade.',
        distance: 12.4,
        estimatedTime: 42,
        elevation: 'higher',
        shade: 'dont-care',
        airQuality: 'care',
        cyclistType: 'recreational',
        reviewCount: 320,
        rating: 4.6,
        checkpoints: [],
        startPoint: { lat: 1.2837, lng: 103.8515, name: 'Raffles Place MRT' },
        endPoint: { lat: 1.3025, lng: 103.9128, name: 'East Coast Park' },
        pointsOfInterestVisited: [{ name: 'Lau Pa Sat Hawker Centre' }, { name: 'Merlion Park' }],
      },
    ]);

    renderPage();

    expect(await screen.findByText('City Breeze Connector')).toBeTruthy();
    expect(screen.getByText('Higher')).toBeTruthy();
    expect(screen.getByText('Dont Care')).toBeTruthy();
    expect(screen.getByText('Care')).toBeTruthy();
    expect(screen.getByText('Lau Pa Sat Hawker Centre, Merlion Park')).toBeTruthy();
  }, 10000);

  it('shows current location label for end point source in expanded request details', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Start', lat: 1.3, lng: 103.8, source: 'search' },
      endPoint: { name: 'Current End', lat: 1.31, lng: 103.81, source: 'current-location' },
      checkpoints: [],
      preferences: {
        cyclistType: 'recreational',
        preferredShade: 50,
        elevation: 50,
        distance: 10,
        airQuality: 50,
      },
    };
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedRequest));

    renderPage();

    const toggle = await screen.findByText('Show request details');
    fireEvent.press(toggle);

    expect(await screen.findByText('Current End')).toBeTruthy();
    expect(screen.getByText(/Current location/i)).toBeTruthy();
  }, 10000);
});
