import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './HomePage';
import { AuthContext } from '../AuthContext';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const mockNavigate = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockGetRoutes = jest.fn();
const mockGetPopularRoutes = jest.fn();
const mockGetUserProfile = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    const mockReact = require('react');

    mockReact.useEffect(() => callback(), [callback]);
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: (...args: unknown[]) => mockSetItem(...args),
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
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
}));

// All mock data defined INSIDE the factory to avoid jest.mock hoisting issues
// Using plain arrow functions instead of jest.fn() for maximum CI stability
jest.mock('../../services/routeService', () => ({
  getRoutes: (...args: unknown[]) => mockGetRoutes(...args),
  getPopularRoutes: (...args: unknown[]) => mockGetPopularRoutes(...args),
}));

describe('HomePage', () => {
  const defaultFavorites = JSON.stringify(['p1']);

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetItem.mockImplementation((key: string) => {
      if (key === 'favoriteRoutes') {
        return Promise.resolve(defaultFavorites);
      }

      return Promise.resolve(null);
    });
    mockSetItem.mockResolvedValue(null);
    mockGetUserProfile.mockResolvedValue({
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
    });
    mockGetRoutes.mockResolvedValue([
      { id: 's1', name: 'Suggested Riverside Loop', description: 'Suggested list route from GET /routes', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
      { id: 's2', name: 'Suggested City Sprint', description: 'Suggested list route from GET /routes', distance: 8.3, elevation: 25, estimatedTime: 25, rating: 4.5, reviewCount: 567, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'commuter', shade: 40, airQuality: 70 },
      { id: 's3', name: 'Suggested Hill Push', description: 'Suggested list route from GET /routes', distance: 18.0, elevation: 260, estimatedTime: 80, rating: 4.7, reviewCount: 210, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'fitness', shade: 55, airQuality: 90 },
      { id: 's4', name: 'Suggested Flat Cruise', description: 'Suggested list route from GET /routes', distance: 28.0, elevation: 180, estimatedTime: 100, rating: 3.9, reviewCount: 60, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'general', shade: 10, airQuality: 10 },
    ]);
    mockGetPopularRoutes.mockResolvedValue([
      { id: 'p1', name: 'Popular Downtown Circuit', description: 'Popular list route from GET /routes/popular', distance: 8.3, elevation: 25, estimatedTime: 25, rating: 4.5, reviewCount: 567, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'commuter', shade: 40, airQuality: 70 },
      { id: 'p2', name: 'Popular Harbor Trail', description: 'Popular list route from GET /routes/popular', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'recreational', shade: 80, airQuality: 85 },
    ]);
  });

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

  const renderHomePage = async (storageOverrides?: { favoriteRoutes?: string | null; userPreferences?: string | null }) => {
    const storage = {
      favoriteRoutes: defaultFavorites,
      userPreferences: null,
      ...storageOverrides,
    };

    mockGetItem.mockImplementation((key: string) => {
      if (key === 'favoriteRoutes') {
        return Promise.resolve(storage.favoriteRoutes);
      }

      if (key === 'userPreferences') {
        return Promise.resolve(storage.userPreferences);
      }

      return Promise.resolve(null);
    });

    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    await screen.findByText('CycleLink');
    await screen.findByText('Starred Routes');
    await waitFor(() => expect(screen.getAllByText('Popular Downtown Circuit').length).toBeGreaterThan(0));
  };

  it('renders the stored favorites section and core actions', async () => {
    await renderHomePage();

    expect(screen.getByText('Discover Routes')).toBeTruthy();
    expect(screen.getByText('Create Custom Route')).toBeTruthy();
    expect(screen.getByText('Starred Routes')).toBeTruthy();
    expect(screen.getByText('Your favorite routes ready to ride again')).toBeTruthy();
    expect(screen.getAllByText('Popular Downtown Circuit').length).toBeGreaterThan(0);
  });

  it('navigates to RouteConfig when create button is pressed', async () => {
    await renderHomePage();

    const createButton = screen.getByText('Create Custom Route');
    fireEvent.press(createButton);

    expect(mockNavigate).toHaveBeenCalledWith('RouteConfig');
  });

  it('renders the recommended and suggested route sections after async data loads', async () => {
    await renderHomePage();

    expect(screen.getByText('Suggested for You')).toBeTruthy();
    expect(screen.getByText('All Recommended Routes')).toBeTruthy();
    expect(screen.getAllByText('commuter').length).toBeGreaterThan(0);
  });

  it('renders suggested routes from getRoutes when preferences exist', async () => {
    await renderHomePage({
      userPreferences: JSON.stringify({
        cyclistType: 'recreational',
        preferredShade: 50,
        elevation: 50,
        distance: 10,
        airQuality: 50,
      }),
    });

    expect(screen.getByText(/Suggested Riverside Loop/i)).toBeTruthy();
    expect(screen.getByText(/Suggested Hill Push/i)).toBeTruthy();
    expect(screen.getByText(/Suggested City Sprint/i)).toBeTruthy();
    expect(screen.queryByText(/Suggested Flat Cruise/i)).toBeNull();
  });

  it('shows the cyclist type saved from route config on the home header', async () => {
    mockGetRoutes.mockResolvedValue([
      { id: 'g1', name: 'General Waterfront', description: 'General route', distance: 12.5, elevation: 45, estimatedTime: 45, rating: 4.8, reviewCount: 234, startPoint: { lat: 0, lng: 0, name: 'Start' }, endPoint: { lat: 0, lng: 0, name: 'End' }, checkpoints: [], cyclistType: 'general', shade: 80, airQuality: 85 },
    ]);
    mockGetPopularRoutes.mockResolvedValue([]);
    mockGetItem.mockImplementation((key: string) => {
      if (key === 'favoriteRoutes') {
        return Promise.resolve(null);
      }

      if (key === 'userPreferences') {
        return Promise.resolve(JSON.stringify({
          cyclistType: 'fitness',
          shadePreference: 'dont-care',
          elevationPreference: 'dont-care',
          maxDistanceKm: 10,
          airQualityPreference: 'care',
          pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
        }));
      }

      return Promise.resolve(null);
    });

    renderWithAuth(<HomeScreen navigation={{ navigate: mockNavigate } as any} route={{} as any} />);

    await waitFor(() => {
      expect(screen.getByText(/^fitness$/i)).toBeTruthy();
    });
    expect(screen.queryByText(/^commuter$/i)).toBeNull();
  });

  it('refreshes route data when the home tab gains focus', async () => {
    await renderHomePage();

    await waitFor(() => {
      expect(mockGetRoutes).toHaveBeenCalledTimes(2);
      expect(mockGetPopularRoutes).toHaveBeenCalledTimes(2);
    });
  });

  it('does not refetch the profile on focus refresh when stored preferences already exist', async () => {
    await renderHomePage({
      userPreferences: JSON.stringify({
        cyclistType: 'fitness',
        shadePreference: 'dont-care',
        elevationPreference: 'dont-care',
        maxDistanceKm: 10,
        airQualityPreference: 'care',
        pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
      }),
    });

    await waitFor(() => {
      expect(mockGetUserProfile).toHaveBeenCalledTimes(0);
    });
  });
});
