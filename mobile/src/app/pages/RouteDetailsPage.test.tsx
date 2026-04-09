import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import RouteDetailsPage from './RouteDetailsPage';
import { getRouteById } from '../types';

const mockResolveRouteById = jest.fn(async (id: string | undefined) => getRouteById(id) ?? null);

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = React.forwardRef((props: any, _ref: unknown) =>
    React.createElement(View, { ...props, testID: props.testID }),
  );
  return {
    __esModule: true,
    default: MockMapView,
    Marker: (props: any) => React.createElement(View, { testID: props.testID, children: props.children }),
    Polyline: () => null,
  };
});

jest.mock('../../services/routeLookup', () => {
  return {
    resolveRouteById: (id: string | undefined) => mockResolveRouteById(id),
  };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockSetOptions = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRouteParams: { routeId?: string; route?: ReturnType<typeof getRouteById> } = { routeId: '1' };

jest.mock('@react-navigation/elements', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  return {
    HeaderBackButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(Pressable, { onPress, testID: 'route-details-header-back' }),
  };
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
    reset: mockReset,
    setOptions: mockSetOptions,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

describe('RouteDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams.routeId = '1';
    delete mockRouteParams.route;
    mockResolveRouteById.mockImplementation(async (id: string | undefined) => getRouteById(id) ?? null);
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
    expect(screen.getByTestId('route-details-map')).toBeTruthy();
    expect(screen.getByTestId('route-details-marker-start')).toBeTruthy();
    expect(screen.getByTestId('route-details-marker-end')).toBeTruthy();
  });

  it('navigates to RouteConfirmed when confirm is pressed', async () => {
    render(<RouteDetailsPage />);
    await waitFor(() => expect(screen.getByTestId('route-details-confirm')).toBeTruthy());
    fireEvent.press(screen.getByTestId('route-details-confirm'));
    expect(mockNavigate).toHaveBeenCalledWith(
      'RouteConfirmed',
      expect.objectContaining({
        routeId: '1',
        route: expect.objectContaining({ id: '1', name: 'Riverside Park Loop' }),
      }),
    );
  });

  it('shows the non-map fallback on Android', async () => {
    const osDescriptor = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'android',
    });

    render(<RouteDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Map preview unavailable on Android')).toBeTruthy();
    });
    expect(screen.queryByTestId('route-details-map')).toBeNull();

    if (osDescriptor) {
      Object.defineProperty(Platform, 'OS', osDescriptor);
    }
  });

  it('renders from the passed route when the detail lookup fails', async () => {
    const route = getRouteById('1');
    mockRouteParams.routeId = route?.id;
    mockRouteParams.route = route;
    mockResolveRouteById.mockResolvedValueOnce(null);

    render(<RouteDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Riverside Park Loop/i)).toBeTruthy();
    });
    expect(screen.queryByText('Route not found')).toBeNull();
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

  it('resets to HomePage when stack cannot go back', async () => {
    mockCanGoBack.mockReturnValueOnce(false);
    mockRouteParams.routeId = 'unknown-id';
    render(<RouteDetailsPage />);
    await waitFor(() => expect(screen.getByText('Route not found')).toBeTruthy());
    fireEvent.press(screen.getByText('Go back'));
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'HomePage' }],
    });
    mockRouteParams.routeId = '1';
    mockCanGoBack.mockReturnValue(true);
  });
});
