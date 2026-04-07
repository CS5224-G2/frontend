import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteConfigPage from './RouteConfigPage';

const mockNavigate = jest.fn();

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
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: any, ref: any) =>
    React.createElement(View, { ...props, ref }),
  );
  const MockMarker = (props: any) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 1.3521, longitude: 103.8198 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([
    { name: 'Raffles Place', street: null, district: null, city: null },
  ]),
  Accuracy: { Balanced: 3 },
}));

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props: any) => React.createElement(View, props) };
});

jest.mock('../../services/locationSearchService', () => ({
  searchLocations: jest.fn().mockResolvedValue([]),
}));

describe('RouteConfigPage', () => {
  const renderPage = () =>
    render(
      <RouteConfigPage navigation={{ navigate: mockNavigate } as any} route={{} as any} />,
    );

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the configure route heading', () => {
    renderPage();
    expect(screen.getByText('Configure Custom Route')).toBeTruthy();
  });

  it('shows "No location selected" for both start and end initially', () => {
    renderPage();
    const placeholders = screen.getAllByText('No location selected');
    expect(placeholders.length).toBe(2);
  });

  it('renders action pills for start and end points', () => {
    renderPage();
    const searchButtons = screen.getAllByText('Search on Map');
    expect(searchButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders all four cyclist type options', () => {
    renderPage();
    expect(screen.getByText('Recreational')).toBeTruthy();
    expect(screen.getByText('Commuter')).toBeTruthy();
    expect(screen.getByText('Fitness')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
  });

  it('renders the Find Routes button', () => {
    renderPage();
    expect(screen.getByText('Find Routes')).toBeTruthy();
  });

  it('shows an alert when Find Routes is pressed without locations', async () => {
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert');
    renderPage();

    fireEvent.press(screen.getByText('Find Routes'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Missing route points', expect.any(String));
    });

    alertSpy.mockRestore();
  });

  it('shows empty checkpoints state', () => {
    renderPage();
    expect(screen.getByText('No checkpoints added yet.')).toBeTruthy();
  });

  it('renders the Add Checkpoint pill', () => {
    renderPage();
    expect(screen.getByText('Add Checkpoint')).toBeTruthy();
  });

  it('opens the map picker modal for the start point', async () => {
    renderPage();
    const searchButtons = screen.getAllByText('Search on Map');
    fireEvent.press(searchButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Select Start Point')).toBeTruthy();
    });
  });

  it('opens the map picker modal for the end point', async () => {
    renderPage();
    const searchButtons = screen.getAllByText('Search on Map');
    fireEvent.press(searchButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Select End Point')).toBeTruthy();
    });
  });

  it('closes the map picker modal when Cancel is pressed', async () => {
    renderPage();
    const searchButtons = screen.getAllByText('Search on Map');
    fireEvent.press(searchButtons[0]);

    await waitFor(() => screen.getByText('Cancel'));
    fireEvent.press(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Select Start Point')).toBeNull();
    });
  });

  it('opens checkpoint picker when Add Checkpoint is pressed', async () => {
    renderPage();
    fireEvent.press(screen.getByText('Add Checkpoint'));

    await waitFor(() => {
      expect(screen.getByText('Checkpoint Details')).toBeTruthy();
    });
  });

  it('sets the start point via current location', async () => {
    renderPage();
    const locateButtons = screen.getAllByText('Use Current Location');
    fireEvent.press(locateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Raffles Place')).toBeTruthy();
    });
  });

  it('loads saved preferences and locations from AsyncStorage on mount', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, source: 'search' },
      endPoint: { name: 'Sentosa', lat: 1.2494, lng: 103.8303, source: 'search' },
      checkpoints: [],
      preferences: {
        cyclistType: 'commuter',
        shadePreference: 'reduce-shade',
        elevationPreference: 'dont-care',
        maxDistanceKm: 15,
        airQualityPreference: 'care',
        pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
      },
    };
    AsyncStorage.getItem.mockImplementation((key: string) => {
      if (key === 'routeRecommendationRequest') return Promise.resolve(JSON.stringify(savedRequest));
      return Promise.resolve(null);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Marina Bay Sands')).toBeTruthy();
      expect(screen.getByText('Sentosa')).toBeTruthy();
    });
  });

  it('shows an alert when start and end coordinates are identical', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert');
    const savedRequest = {
      startPoint: { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, source: 'search' },
      endPoint: { name: 'Marina Bay duplicate', lat: 1.2834, lng: 103.8607, source: 'map' },
      checkpoints: [],
      preferences: {
        cyclistType: 'general',
        shadePreference: 'dont-care',
        elevationPreference: 'dont-care',
        maxDistanceKm: 10,
        airQualityPreference: 'care',
        pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
      },
    };
    AsyncStorage.getItem.mockImplementation((key: string) => {
      if (key === 'routeRecommendationRequest') return Promise.resolve(JSON.stringify(savedRequest));
      return Promise.resolve(null);
    });

    renderPage();

    await waitFor(() => screen.getByText('Marina Bay Sands'));
    fireEvent.press(screen.getByText('Find Routes'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Invalid route points',
        'Choose different locations for the start point and end point before continuing.',
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('navigates to Recommendation after saving a valid route config', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const savedRequest = {
      startPoint: { name: 'Marina Bay Sands', lat: 1.2834, lng: 103.8607, source: 'search' },
      endPoint: { name: 'Sentosa', lat: 1.2494, lng: 103.8303, source: 'search' },
      checkpoints: [
        { id: 'checkpoint-1', name: 'Marina Barrage', lat: 1.2808, lng: 103.8707, source: 'map' },
      ],
      preferences: {
        cyclistType: 'general',
        shadePreference: 'dont-care',
        elevationPreference: 'dont-care',
        maxDistanceKm: 10,
        airQualityPreference: 'care',
        pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
      },
    };
    AsyncStorage.getItem.mockImplementation((key: string) => {
      if (key === 'routeRecommendationRequest') return Promise.resolve(JSON.stringify(savedRequest));
      return Promise.resolve(null);
    });

    renderPage();

    await waitFor(() => screen.getByText('Marina Bay Sands'));
    fireEvent.press(screen.getByText('Find Routes'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Recommendation');
    });

    const persistedRouteRequestCall = AsyncStorage.setItem.mock.calls.find(
      ([key]: [string]) => key === 'routeRecommendationRequest',
    );
    expect(persistedRouteRequestCall).toBeDefined();

    const persistedRouteRequest = JSON.parse(persistedRouteRequestCall[1]);
    expect(persistedRouteRequest.preferences).toMatchObject({
      cyclistType: 'general',
      maxDistanceKm: 10,
      shadePreference: 'dont-care',
      elevationPreference: 'dont-care',
      airQualityPreference: 'care',
    });
    expect(persistedRouteRequest.limit).toBe(3);
    expect(persistedRouteRequest.checkpoints[0]).toMatchObject({
      id: 'checkpoint-1',
      name: 'Marina Barrage',
      lat: 1.2808,
      lng: 103.8707,
      source: 'map',
    });
    expect(persistedRouteRequest.checkpoints[0]).not.toHaveProperty('description');
  });
});
