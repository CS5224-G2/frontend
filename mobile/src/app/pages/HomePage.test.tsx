import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './HomePage';
import { AuthContext } from '../AuthContext';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  // Do not run the real focus effect: it async-loads favorites and triggers act() warnings.
  useFocusEffect: jest.fn(),
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

jest.mock('../../services/userService', () => ({
  getUserProfile: () =>
    Promise.resolve({
      userId: 'u1',
      fullName: 'Alex Rider',
      email: 'alex@example.com',
      location: 'Singapore',
      memberSince: 'January 2025',
      cyclingPreference: 'Commuter',
      weeklyGoalKm: 80,
      bio: 'Rider bio',
      avatarUrl: null,
      avatarColor: '#1D4ED8',
      stats: {
        totalRides: 1,
        totalDistanceKm: 10,
        favoriteTrails: 1,
      },
    }),
}));

// All mock data defined INSIDE the factory to avoid jest.mock hoisting issues
// Using plain arrow functions instead of jest.fn() for maximum CI stability
jest.mock('../../services/routeService', () => ({
  getRoutes: () => Promise.resolve([
    { id: 's1', name: 'Suggested Riverside Loop', description: 'Suggested list route from GET /routes', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
    { id: 's2', name: 'Suggested City Sprint', description: 'Suggested list route from GET /routes', distance: 8.3, elevation: 25, estimatedTime: 25, rating: 4.5, reviewCount: 567, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'commuter', shade: 40, airQuality: 70 },
    { id: 's3', name: 'Suggested Hill Push', description: 'Suggested list route from GET /routes', distance: 18.0, elevation: 260, estimatedTime: 80, rating: 4.7, reviewCount: 210, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'fitness', shade: 55, airQuality: 90 },
    { id: 's4', name: 'Suggested Flat Cruise', description: 'Suggested list route from GET /routes', distance: 28.0, elevation: 180, estimatedTime: 100, rating: 3.9, reviewCount: 60, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'general', shade: 10, airQuality: 10 },
  ]),
  getPopularRoutes: () => Promise.resolve([
    { id: 'p1', name: 'Popular Downtown Circuit', description: 'Popular list route from GET /routes/popular', distance: 8.3, elevation: 25, estimatedTime: 25, rating: 4.5, reviewCount: 567, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'commuter', shade: 40, airQuality: 70 },
    { id: 'p2', name: 'Popular Harbor Trail', description: 'Popular list route from GET /routes/popular', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
  ]),
}));

describe('HomePage', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <SafeAreaProvider>
        <AuthContext.Provider
          value={{
            isRestoring: false,
            isLoggedIn: true,
            role: 'user',
            user: null,
            login: jest.fn(),
            logout: jest.fn(),
          }}
        >
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
    expect(screen.getAllByText('commuter').length).toBeGreaterThan(0);
  });

  it('navigates to RouteConfig when create button is pressed', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    const createButton = await screen.findByText('Create Custom Route');
    fireEvent.press(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('RouteConfig');
  });

  it('renders recommended routes', async () => {
    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    expect(await screen.findByText(/Popular Downtown Circuit/i)).toBeTruthy();
  });

  it('renders suggested routes from getRoutes when preferences exist', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockImplementation((key: string) => {
      if (key === 'userPreferences') {
        return Promise.resolve(JSON.stringify({
          cyclistType: 'recreational',
          preferredShade: 50,
          elevation: 50,
          distance: 10,
          airQuality: 50,
        }));
      }
      return Promise.resolve(null);
    });

    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    expect(await screen.findByText(/Suggested Riverside Loop/i)).toBeTruthy();
    expect(screen.getByText(/Suggested Hill Push/i)).toBeTruthy();
    expect(screen.getByText(/Suggested City Sprint/i)).toBeTruthy();
    expect(screen.queryByText(/Suggested Flat Cruise/i)).toBeNull();
  });
});
