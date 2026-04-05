jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../app/utils/routePreferences', () => ({
  normalizeUserPreferences: jest.fn((p) => p),
}));

import { httpClient } from './httpClient';
import { getRoutes, getPopularRoutes, getRouteById, getRouteRecommendations } from './routeService';

const mockGet = httpClient.get as jest.Mock;
const mockPost = httpClient.post as jest.Mock;

const backendRoute = {
  route_id: 'rt1',
  name: 'Waterfront Loop',
  description: 'Scenic coastal route',
  distance: 14.2,
  elevation: 80,
  estimated_time: 55,
  rating: 4.5,
  review_count: 120,
  start_point: { lat: 1.28, lng: 103.85, name: 'Marina' },
  end_point: { lat: 1.29, lng: 103.87, name: 'Gardens' },
  checkpoints: [],
  cyclist_type: 'recreational' as const,
  shade: 65,
  air_quality: 85,
};

beforeEach(() => jest.clearAllMocks());

describe('getRoutes()', () => {
  it('maps BackendRoute array to Route array', async () => {
    mockGet.mockResolvedValueOnce([backendRoute]);
    const routes = await getRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0].id).toBe('rt1');
    expect(routes[0].name).toBe('Waterfront Loop');
    expect(routes[0].rating).toBe(4.5);
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/routes'), undefined);
  });
});

describe('getPopularRoutes()', () => {
  it('calls /routes/popular with limit clamped to max 3', async () => {
    mockGet.mockResolvedValueOnce([backendRoute]);
    await getPopularRoutes(5);
    expect(mockGet).toHaveBeenCalledWith('/routes/popular?limit=3', undefined);
  });
});

describe('getRouteById()', () => {
  it('returns mapped Route for a valid ID', async () => {
    mockGet.mockResolvedValueOnce(backendRoute);
    const route = await getRouteById('rt1');
    expect(route).not.toBeNull();
    expect(route?.id).toBe('rt1');
  });

  it('returns null when API throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('404'));
    const route = await getRouteById('nonexistent');
    expect(route).toBeNull();
  });
});

describe('getRouteRecommendations()', () => {
  it('posts the current route recommendation request contract and returns mapped routes', async () => {
    mockPost.mockResolvedValueOnce([{ ...backendRoute, route_id: 'rec1' }]);
    const routes = await getRouteRecommendations({
      startPoint: { name: 'Raffles Place MRT', lat: 1.2837, lng: 103.8515, source: 'search' },
      endPoint: { name: 'East Coast Park', lat: 1.3025, lng: 103.9128, source: 'current-location' },
      checkpoints: [
        { id: 'checkpoint-1', name: 'Marina Barrage', lat: 1.2808, lng: 103.8707, source: 'map' },
      ],
      preferences: {
        cyclistType: 'recreational',
        shadePreference: 'dont-care',
        elevationPreference: 'dont-care',
        maxDistanceKm: 20,
        airQualityPreference: 'dont-care',
        pointsOfInterest: {
          hawkerCenter: false,
          historicSite: false,
          park: false,
          touristAttraction: false,
        },
      },
      limit: 3,
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/routes/recommendations',
      expect.objectContaining({
        start_point: { name: 'Raffles Place MRT', lat: 1.2837, lng: 103.8515, source: 'search' },
        end_point: { name: 'East Coast Park', lat: 1.3025, lng: 103.9128, source: 'current-location' },
        checkpoints: [
          { id: 'checkpoint-1', name: 'Marina Barrage', lat: 1.2808, lng: 103.8707, source: 'map' },
        ],
        preferences: expect.objectContaining({
          cyclist_type: 'recreational',
          shade_preference: 'dont-care',
          elevation_preference: 'dont-care',
          air_quality_preference: 'dont-care',
          max_distance: 20,
        }),
        limit: 3,
      }),
      undefined,
    );
    expect(mockPost.mock.calls[0][1].checkpoints[0]).not.toHaveProperty('description');
    expect(routes[0].id).toBe('rec1');
  });
});
