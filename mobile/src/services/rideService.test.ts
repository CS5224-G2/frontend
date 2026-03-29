// =============================================================================
// RIDE SERVICE TESTS — Mobile
// Tests the rideService in mock mode (EXPO_PUBLIC_USE_MOCKS=true).
// Env var must be set BEFORE the service module is evaluated.
// =============================================================================

let getRideHistory: typeof import('./rideService').getRideHistory;
let getRideById: typeof import('./rideService').getRideById;
let getDistanceStats: typeof import('./rideService').getDistanceStats;
let submitRideFeedback: typeof import('./rideService').submitRideFeedback;

beforeAll(() => {
  process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const svc = require('./rideService') as typeof import('./rideService');
    getRideHistory = svc.getRideHistory;
    getRideById = svc.getRideById;
    getDistanceStats = svc.getDistanceStats;
    submitRideFeedback = svc.submitRideFeedback;
  });
});

describe('rideService (mock mode)', () => {
  describe('getRideHistory()', () => {
    it('returns an array of ride history entries', async () => {
      const history = await getRideHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('returns RideHistory objects with correct camelCase shape', async () => {
      const [ride] = await getRideHistory();
      expect(ride).toHaveProperty('id');
      expect(ride).toHaveProperty('routeId');
      expect(ride).toHaveProperty('totalTime');
      expect(ride).toHaveProperty('avgSpeed');
      expect(ride).toHaveProperty('checkpoints');
    });
  });

  describe('getRideById()', () => {
    it('returns the correct ride for a valid ID', async () => {
      const ride = await getRideById('1');
      expect(ride).not.toBeNull();
      expect(ride?.id).toBe('1');
      expect(ride?.routeDetails).toBeDefined();
      expect(ride?.routeDetails?.id).toBe('1');
      expect(ride?.visitedCheckpoints?.length).toBeGreaterThan(0);
      expect(ride?.pointsOfInterestVisited?.length).toBeGreaterThan(0);
    });

    it('returns null for an unknown ride ID', async () => {
      const ride = await getRideById('nonexistent-99');
      expect(ride).toBeNull();
    });
  });

  describe('getDistanceStats()', () => {
    it('returns weekly data points when period is "week"', async () => {
      const points = await getDistanceStats('week');
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBe(7);
      points.forEach((p) => expect(p).toHaveProperty('distance'));
    });

    it('returns monthly data points when period is "month"', async () => {
      const points = await getDistanceStats('month');
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBe(4);
    });
  });

  describe('submitRideFeedback()', () => {
    it('resolves without throwing in mock mode', async () => {
      await expect(
        submitRideFeedback({ routeId: '1', rating: 5, review: 'Great ride!' }),
      ).resolves.toBeUndefined();
    });

    it('resolves even with empty review text', async () => {
      await expect(
        submitRideFeedback({ routeId: '2', rating: 3, review: '' }),
      ).resolves.toBeUndefined();
    });
  });
});
