import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './HomePage';
import { AuthContext } from '../AuthContext';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  FontAwesome5: 'FontAwesome5',
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// All mock data defined INSIDE the factory to avoid jest.mock hoisting issues
// Using plain arrow functions instead of jest.fn() for maximum CI stability
jest.mock('../../services/routeService', () => ({
  getRoutes: () => Promise.resolve([
    { id: '1', name: 'Riverside Park Loop', description: 'A scenic route along the river', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
    { id: '2', name: 'City Commuter Express', description: 'Fast commuter route', distance: 8.3, elevation: 25, estimatedTime: 25, rating: 4.5, reviewCount: 567, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'commuter', shade: 40, airQuality: 70 },
  ]),
  getRouteRecommendations: () => Promise.resolve([
    { id: '1', name: 'Riverside Park Loop', description: 'A scenic route along the river', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
  ]),
}));

describe('HomePage', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <SafeAreaProvider>
        <AuthContext.Provider value={{ login: jest.fn(), logout: jest.fn(), isLoggedIn: true, role: 'user' }}>
          {component}
        </AuthContext.Provider>
      </SafeAreaProvider>
    );
  };

  it('renders correctly', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    await waitFor(() => expect(screen.getByText('CycleLink')).toBeTruthy());
    expect(screen.getByText('Discover Routes')).toBeTruthy();
    expect(screen.getByText('Create Custom Route')).toBeTruthy();
  });

  it('navigates to RouteConfig when create button is pressed', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    const createButton = await screen.findByText('Create Custom Route');
    fireEvent.press(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('RouteConfig');
  });

  it('renders recommended routes', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    expect(await screen.findByText(/Riverside Park Loop/i)).toBeTruthy();
  });
});
