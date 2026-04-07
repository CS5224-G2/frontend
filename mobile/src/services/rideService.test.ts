jest.mock('./httpClient', () => {
  class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    ApiError,
    httpClient: { get: jest.fn(), post: jest.fn() },
  };
});

jest.mock('./localDb', () => ({
  saveRideFeedbackLocal: jest.fn().mockResolvedValue(undefined),
  saveRideLocal: jest.fn(),
  getRideHistoryLocal: jest.fn().mockResolvedValue([]),
  getRideByIdLocal: jest.fn().mockResolvedValue(null),
  getPendingLocalDistanceStats: jest.fn().mockResolvedValue([]),
  getDistanceStatsLocal: jest.fn().mockResolvedValue([]),
}));

import { httpClient, ApiError } from './httpClient';
import {
  getDistanceStatsLocal,
  getPendingLocalDistanceStats,
  getRideByIdLocal,
  getRideHistoryLocal,
  saveRideFeedbackLocal,
  saveRideLocal,
} from './localDb';
import { getRideHistory, getRideById, getDistanceStats, submitRideFeedback, saveRide } from './rideService';

const mockGet = httpClient.get as jest.Mock;
const mockPost = httpClient.post as jest.Mock;
const mockSaveLocal = saveRideFeedbackLocal as jest.MockedFunction<typeof saveRideFeedbackLocal>;
const mockSaveRideLocal = saveRideLocal as jest.MockedFunction<typeof saveRideLocal>;
const mockGetLocalHistory = getRideHistoryLocal as jest.MockedFunction<typeof getRideHistoryLocal>;
const mockGetLocalRideById = getRideByIdLocal as jest.MockedFunction<typeof getRideByIdLocal>;
const mockGetPendingLocalDistanceStats =
  getPendingLocalDistanceStats as jest.MockedFunction<typeof getPendingLocalDistanceStats>;
const mockGetLocalDistanceStats =
  getDistanceStatsLocal as jest.MockedFunction<typeof getDistanceStatsLocal>;

const backendRide = {
  ride_id: 'r1',
  route_id: 'rt1',
  route_name: 'Park Connector',
  completion_date: '2026-03-01',
  completion_time: '45:30',
  total_time: 2730,
  distance: 12.5,
  avg_speed: 18.2,
  checkpoints_visited: 3,
  rating: 4,
  review: 'Great ride!',
};

beforeEach(() => jest.clearAllMocks());

describe('getRideHistory()', () => {
  it('maps BackendRide array to RideHistory array', async () => {
    mockGet.mockResolvedValueOnce([backendRide]);
    mockGetLocalHistory.mockResolvedValueOnce([]);
    const history = await getRideHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('r1');
    expect(history[0].routeId).toBe('rt1');
    expect(history[0].totalTime).toBe(2730);
    expect(history[0].avgSpeed).toBe(18.2);
    expect(history[0].checkpoints).toBe(3);
    expect(history[0].userRating).toBe(4);
    expect(mockGet).toHaveBeenCalledWith('/rides/history', undefined);
  });
});

describe('getRideById()', () => {
  it('returns mapped RideHistory for a valid ID', async () => {
    mockGet.mockResolvedValueOnce(backendRide);
    const ride = await getRideById('r1');
    expect(ride).not.toBeNull();
    expect(ride?.id).toBe('r1');
  });

  it('returns null when the API throws (e.g. 404)', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    mockGetLocalRideById.mockResolvedValueOnce(null);
    const ride = await getRideById('nonexistent');
    expect(ride).toBeNull();
  });
});

describe('getDistanceStats()', () => {
  it('maps weekly stats to GraphDataPoint with day field', async () => {
    mockGet.mockResolvedValueOnce([
      { period_id: 'w1', label: 'Mon', distance: 5.0 },
      { period_id: 'w2', label: 'Tue', distance: 8.2 },
    ]);
    mockGetPendingLocalDistanceStats.mockResolvedValueOnce([]);
    const stats = await getDistanceStats('week');
    expect(stats[0]).toEqual({ id: 'w1', day: 'Mon', distance: 5.0 });
    expect(stats[1]).toEqual({ id: 'w2', day: 'Tue', distance: 8.2 });
  });

  it('maps monthly stats to GraphDataPoint with week field', async () => {
    mockGet.mockResolvedValueOnce([{ period_id: 'm1', label: 'Week 1', distance: 42.0 }]);
    mockGetPendingLocalDistanceStats.mockResolvedValueOnce([]);
    const stats = await getDistanceStats('month');
    expect(stats[0]).toEqual({ id: 'm1', week: 'Week 1', distance: 42.0 });
  });
});

describe('submitRideFeedback()', () => {
  it('posts snake_case payload to /rides/feedback', async () => {
    mockPost.mockResolvedValueOnce(undefined);
    await submitRideFeedback({ routeId: 'rt1', rating: 5, review: 'Amazing!' });
    expect(mockPost).toHaveBeenCalledWith(
      '/rides/feedback',
      { route_id: 'rt1', rating: 5, review_text: 'Amazing!' },
      undefined,
    );
    expect(mockSaveLocal).not.toHaveBeenCalled();
  });

  it('persists locally when API returns 404 (unknown route or missing endpoint)', async () => {
    mockPost.mockRejectedValueOnce(new ApiError(404, '{"detail":"Not Found"}'));
    await submitRideFeedback({ routeId: 'api-unknown-id', rating: 4, review: 'Nice' });
    expect(mockSaveLocal).toHaveBeenCalledWith({
      routeId: 'api-unknown-id',
      rating: 4,
      reviewText: 'Nice',
    });
  });
});

describe('saveRide()', () => {
  const route = {
    id: 'rt1',
    name: 'Park Connector',
    description: 'Scenic route',
    distance: 12.5,
    elevation: 20,
    estimatedTime: 48,
    rating: 4.7,
    reviewCount: 12,
    startPoint: { lat: 1.28, lng: 103.85, name: 'Start' },
    endPoint: { lat: 1.29, lng: 103.86, name: 'End' },
    checkpoints: [
      { id: 'cp1', name: 'Pier 1', lat: 1.281, lng: 103.851, description: 'Checkpoint 1' },
      { id: 'cp2', name: 'Pier 2', lat: 1.282, lng: 103.852, description: 'Checkpoint 2' },
    ],
    cyclistType: 'commuter' as const,
    shade: 60,
    airQuality: 40,
    pointsOfInterestVisited: [{ name: 'Pier', description: 'Nice spot', lat: 1.281, lng: 103.851 }],
  };

  it('posts to /rides and returns mapped RideHistory', async () => {
    mockPost.mockResolvedValueOnce(backendRide);
    const result = await saveRide({
      route,
      startTime: '2026-03-01T09:42:00.000Z',
      endTime: '2026-03-01T10:30:00.000Z',
      distance: 12.5,
      avgSpeed: 18.2,
      checkpointsVisited: 2,
      pointsOfInterestVisited: route.pointsOfInterestVisited,
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/rides',
      expect.objectContaining({
        route_id: 'rt1',
        start_time: '2026-03-01T09:42:00.000Z',
        end_time: '2026-03-01T10:30:00.000Z',
        distance: 12.5,
      }),
      undefined,
    );
    expect(result.id).toBe('r1');
  });

  it('falls back to local persistence when backend save fails', async () => {
    mockPost.mockRejectedValueOnce(new ApiError(404, '{"detail":"Route not found"}'));
    mockSaveRideLocal.mockResolvedValueOnce({
      id: 'local-1',
      routeId: 'rt1',
      routeName: 'Park Connector',
      completionDate: 'March 1, 2026',
      completionTime: '10:30 AM',
      startTime: '2026-03-01T09:42:00.000Z',
      endTime: '2026-03-01T10:30:00.000Z',
      totalTime: 48,
      distance: 12.5,
      avgSpeed: 18.2,
      checkpoints: 2,
      routeDetails: route,
    });

    const result = await saveRide({
      route,
      startTime: '2026-03-01T09:42:00.000Z',
      endTime: '2026-03-01T10:30:00.000Z',
      distance: 12.5,
      avgSpeed: 18.2,
      checkpointsVisited: 2,
    });

    expect(mockSaveRideLocal).toHaveBeenCalledWith(
      expect.objectContaining({
        route,
        startTime: '2026-03-01T09:42:00.000Z',
        endTime: '2026-03-01T10:30:00.000Z',
        checkpointsVisited: 2,
      }),
    );
    expect(result.id).toBe('local-1');
  });
});
