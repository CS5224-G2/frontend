jest.mock('./httpClient', () => ({
  httpClient: { get: jest.fn(), post: jest.fn() },
}));

import { httpClient } from './httpClient';
import { getRideHistory, getRideById, getDistanceStats, submitRideFeedback, saveRide } from './rideService';

const mockGet = httpClient.get as jest.Mock;
const mockPost = httpClient.post as jest.Mock;

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
    const stats = await getDistanceStats('week');
    expect(stats[0]).toEqual({ id: 'w1', day: 'Mon', distance: 5.0 });
    expect(stats[1]).toEqual({ id: 'w2', day: 'Tue', distance: 8.2 });
  });

  it('maps monthly stats to GraphDataPoint with week field', async () => {
    mockGet.mockResolvedValueOnce([{ period_id: 'm1', label: 'Week 1', distance: 42.0 }]);
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
  });
});

describe('saveRide()', () => {
  it('posts to /routes/save and returns mapped RideHistory', async () => {
    mockPost.mockResolvedValueOnce(backendRide);
    const result = await saveRide({
      routeId: 'rt1',
      completionDate: '2026-03-01',
      totalTime: 2730,
      distance: 12.5,
      avgSpeed: 18.2,
      checkpointsVisited: 3,
    });
    expect(mockPost).toHaveBeenCalledWith(
      '/routes/save',
      expect.objectContaining({ route_id: 'rt1', total_time: 2730, distance: 12.5 }),
      undefined,
    );
    expect(result.id).toBe('r1');
  });
});
