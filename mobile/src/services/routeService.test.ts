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
  it('posts to /routes/recommendations and returns mapped routes', async () => {
    mockPost.mockResolvedValueOnce([{ ...backendRoute, route_id: 'rec1' }]);
    const routes = await getRouteRecommendations({
      cyclistType: 'recreational',
      preferredShade: 50,
      elevation: 100,
      distance: 20,
      airQuality: 80,
      shadePreference: 'dont-care',
      elevationPreference: 'dont-care',
      maxDistanceKm: 20,
      airQualityPreference: 'dont-care',
      pointsOfInterest: { hawkerCenter: false, historicSite: false, park: false, touristAttraction: false },
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/routes/recommendations',
      expect.objectContaining({ limit: 3 }),
      undefined,
    );
    expect(routes[0].id).toBe('rec1');
  });
});
