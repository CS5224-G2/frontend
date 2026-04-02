// =============================================================================
// ROUTE SERVICE TESTS — Mobile
// Tests the routeService in mock mode (EXPO_PUBLIC_USE_MOCKS=true).
// Env var must be set BEFORE the service module is evaluated.
// =============================================================================

// Declare typed service at the top — will be assigned inside isolateModules
let getRoutes: typeof import('./routeService').getRoutes;
let getPopularRoutes: typeof import('./routeService').getPopularRoutes;
let getRouteById: typeof import('./routeService').getRouteById;
let getRouteRecommendations: typeof import('./routeService').getRouteRecommendations;

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const svc = require('./routeService') as typeof import('./routeService');
    getRoutes = svc.getRoutes;
    getPopularRoutes = svc.getPopularRoutes;
    getRouteById = svc.getRouteById;
    getRouteRecommendations = svc.getRouteRecommendations;
  });
});

describe('routeService (mock mode)', () => {
  describe('getRoutes()', () => {
    it('returns all routes when no preferences provided', async () => {
      const routes = await getRoutes();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('filters routes by cyclist type', async () => {
      const routes = await getRoutes({
        cyclistType: 'recreational',
        preferredShade: 50,
        elevation: 50,
        distance: 30,
        airQuality: 0,
      });
      routes.forEach((r) => {
        expect(r.cyclistType).toBe('recreational');
      });
    });

    it('returns Route objects with correct camelCase shape', async () => {
      const [route] = await getRoutes();
      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('name');
      expect(route).toHaveProperty('estimatedTime');
      expect(route).toHaveProperty('reviewCount');
      expect(route).toHaveProperty('cyclistType');
      expect(route).toHaveProperty('airQuality');
    });
  });

  describe('getRouteById()', () => {
    it('returns the correct route for a valid ID', async () => {
      const route = await getRouteById('1');
      expect(route).not.toBeNull();
      expect(route?.id).toBe('1');
    });

    it('returns null for an unknown ID', async () => {
      const route = await getRouteById('does-not-exist');
      expect(route).toBeNull();
    });
  });

  describe('getPopularRoutes()', () => {
    it('returns at most the requested limit', async () => {
      const routes = await getPopularRoutes(2);
      expect(routes.length).toBeLessThanOrEqual(2);
    });

    it('returns routes in route shape', async () => {
      const [route] = await getPopularRoutes(1);
      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('name');
      expect(route).toHaveProperty('estimatedTime');
      expect(route).toHaveProperty('reviewCount');
    });
  });

  describe('getRouteRecommendations()', () => {
    it('returns at most `limit` routes', async () => {
      const routes = await getRouteRecommendations(
        { cyclistType: 'recreational', preferredShade: 60, elevation: 40, distance: 15, airQuality: 70 },
        3,
      );
      expect(routes.length).toBeLessThanOrEqual(3);
    });

    it('returns routes with all required fields', async () => {
      const [first] = await getRouteRecommendations(
        { cyclistType: 'commuter', preferredShade: 30, elevation: 20, distance: 10, airQuality: 65 },
        1,
      );
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('rating');
      expect(typeof first.rating).toBe('number');
    });
  });
});

