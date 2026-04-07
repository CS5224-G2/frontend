import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RouteDetailsPage from './RouteDetailsPage';

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
  const types = jest.requireActual('../types') as { getRouteById: (id: string | undefined) => unknown };
  return {
    resolveRouteById: jest.fn(async (id: string | undefined) => {
      const r = types.getRouteById(id);
      return r ?? null;
    }),
  };
});

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();
const mockSetOptions = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRouteParams = { routeId: '1' };

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
