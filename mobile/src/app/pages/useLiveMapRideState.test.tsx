import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { STORAGE_KEYS } from '../../constants/routeStorage';
import { mockRoutes } from '../types';
import { useLiveMapRideState } from './useLiveMapRideState';

const mockNavigate = jest.fn();
const mockReset = jest.fn();
let mockLiveMapProgressSimulationEnabled = false;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

jest.mock('../../config/runtime', () => ({
  get LIVE_MAP_PROGRESS_SIMULATION() {
    return mockLiveMapProgressSimulationEnabled;
  },
}));

jest.mock('../../services/routeLookup', () => ({
  resolveRouteById: jest.fn(async () => null),
}));

jest.mock('../../services/rideService', () => ({
  saveRide: jest.fn(async () => undefined),
}));

const { saveRide } = jest.requireMock('../../services/rideService') as {
  saveRide: jest.Mock;
};

describe('useLiveMapRideState', () => {
  const originalEnv = process.env;
  const route = mockRoutes[1];

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockLiveMapProgressSimulationEnabled = false;
    await AsyncStorage.clear();
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: route.startPoint.lat,
        longitude: route.startPoint.lng,
        accuracy: 8,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementation(async (_options, callback) => {
      callback({
        coords: {
          latitude: route.startPoint.lat,
          longitude: route.startPoint.lng,
          accuracy: 8,
        },
      });
      return { remove: jest.fn() };
    });
  });

  afterEach(async () => {
    jest.clearAllTimers();
    jest.useRealTimers();
    process.env = { ...originalEnv };
  });

  it('uses device location for the rider marker by default', async () => {
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: route.startPoint.lat,
        longitude: route.startPoint.lng,
        accuracy: 8,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(async (_options, callback) => {
      callback({
        coords: {
          latitude: route.startPoint.lat,
          longitude: route.startPoint.lng,
          accuracy: 8,
        },
      });
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    expect(result.current.progress).toBe(0);
    expect(result.current.distanceTraveled).toBe('0.00');
    expect(result.current.routeCompleted).toBe(false);
    expect(result.current.riderPoint.geometry.coordinates).toEqual([
      route.startPoint.lng,
      route.startPoint.lat,
    ]);
  });

  it('records movement from GPS location updates', async () => {
    const movedLat = (route.startPoint.lat + route.checkpoints[0].lat) / 2;
    const movedLng = (route.startPoint.lng + route.checkpoints[0].lng) / 2;

    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: route.startPoint.lat,
        longitude: route.startPoint.lng,
        accuracy: 8,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(async (_options, callback) => {
      callback({
        coords: {
          latitude: route.startPoint.lat,
          longitude: route.startPoint.lng,
          accuracy: 8,
        },
      });
      callback({
        coords: {
          latitude: movedLat,
          longitude: movedLng,
          accuracy: 8,
        },
      });
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.distanceTraveled).not.toBe('0.00');
      expect(result.current.progress).toBeGreaterThan(0);
      expect(result.current.riderPoint.geometry.coordinates).toEqual([
        movedLng,
        movedLat,
      ]);
    });
  });

  it('auto-advances progress only when simulation is enabled', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-07T10:00:00.000Z'));
    mockLiveMapProgressSimulationEnabled = true;

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.progress).toBeGreaterThanOrEqual(4);
    expect(result.current.progress).toBeLessThanOrEqual(6);
    expect(result.current.distanceTraveled).not.toBe('0.00');
    expect(result.current.riderHasFix).toBe(true);
    expect(result.current.riderLngLat).toEqual(result.current.riderPoint.geometry.coordinates);
  });

  it('does not end the ride until end is explicitly confirmed', async () => {
    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    act(() => {
      result.current.stopCycling();
    });

    expect(result.current.showExitModal).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      result.current.confirmEndRide();
    });

    expect(mockNavigate).not.toHaveBeenCalledWith('RouteFeedback', expect.anything());
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'HomePage' }],
    });
  });

  it('restores elapsed time from a persisted active session', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-07T10:00:00.000Z'));

    await AsyncStorage.setItem(
      STORAGE_KEYS.activeRideSession,
      JSON.stringify({
        version: 1,
        routeId: route.id,
        route,
        startedAt: '2026-04-07T09:58:45.000Z',
        lastKnownPosition: {
          lat: route.checkpoints[0].lat,
          lng: route.checkpoints[0].lng,
        },
        distanceKm: 1.23,
        progressPct: 35,
      }),
    );

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    expect(result.current.elapsedSec).toBe(75);
    expect(result.current.distanceTraveled).toBe('1.23');
  });

  it('clears the persisted active session when the ride ends', async () => {
    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      result.current.confirmEndRide();
    });

    expect(await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession)).toBeNull();
  });

  it('pauses and resumes the ride timer without losing the session', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T00:00:00.000Z'));

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(20000);
    });

    act(() => {
      result.current.pauseRide();
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(true);
    });

    const pausedElapsed = result.current.elapsedSec;

    await act(async () => {
      jest.advanceTimersByTime(20000);
    });

    expect(result.current.elapsedSec).toBe(pausedElapsed);

    act(() => {
      result.current.resumeRide();
    });

    await waitFor(() => {
      expect(result.current.isPaused).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSec).toBeGreaterThan(pausedElapsed);
  });

  it('navigates to feedback only when the route is completed', async () => {
    mockLiveMapProgressSimulationEnabled = true;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T00:00:00.000Z'));

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(50000);
    });

    await waitFor(() => {
      expect(result.current.routeCompleted).toBe(true);
    });

    expect(result.current.showCompletionModal).toBe(true);

    act(() => {
      result.current.finishCompletedRide();
    });

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'HomePage' }],
      });
    });

    expect(saveRide).toHaveBeenCalled();
  });

  it('still allows completed rides to continue to feedback', async () => {
    mockLiveMapProgressSimulationEnabled = true;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T00:00:00.000Z'));

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(50000);
    });

    await waitFor(() => {
      expect(result.current.routeCompleted).toBe(true);
    });

    await act(async () => {
      result.current.goFeedback();
    });

    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [
        {
          name: 'RouteFeedback',
          params: expect.objectContaining({
            routeId: route.id,
            route,
            rideSummary: expect.objectContaining({
              elapsedMinutes: expect.any(Number),
            }),
          }),
        },
      ],
    });
  });

  it('finalizes the ride immediately once completion is reached', async () => {
    mockLiveMapProgressSimulationEnabled = true;
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-08T00:00:00.000Z'));

    const { result } = renderHook(() => useLiveMapRideState(route.id, route));

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await act(async () => {
      jest.advanceTimersByTime(50000);
    });

    await waitFor(() => {
      expect(result.current.routeCompleted).toBe(true);
      expect(result.current.showCompletionModal).toBe(true);
    });

    const completedElapsed = result.current.elapsedSec;

    await waitFor(async () => {
      expect(await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession)).toBeNull();
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSec).toBe(completedElapsed);
  });
});

describe('POI visited detection', () => {
  const routeWithPoi = {
    ...mockRoutes[1],
    pointsOfInterestVisited: [
      {
        name: 'Bryant Park Snack Stop',
        description: 'Nearby route POI',
        lat: mockRoutes[1].checkpoints[0].lat,
        lng: mockRoutes[1].checkpoints[0].lng,
        category: 'hawkerCenter' as const,
      },
      {
        name: 'Far Away Place',
        description: 'Not nearby',
        lat: 1.3,
        lng: 104.0,
        category: 'park' as const,
      },
    ],
  };

  it('adds a POI index to visitedPoiIndices when the rider is within 80 m', async () => {
    const poi = routeWithPoi.pointsOfInterestVisited[0];
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: { latitude: poi.lat, longitude: poi.lng, accuracy: 5 },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
      async (_opts: unknown, cb: (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void) => {
        cb({ coords: { latitude: poi.lat, longitude: poi.lng, accuracy: 5 } });
        return { remove: jest.fn() };
      }
    );

    const { result } = renderHook(() =>
      useLiveMapRideState(routeWithPoi.id, routeWithPoi)
    );

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.visitedPoiIndices.has(0)).toBe(true);
    });

    // The far-away POI should still be unvisited
    expect(result.current.visitedPoiIndices.has(1)).toBe(false);
  });

  it('does not add a POI when rider is far away', async () => {
    // Rider is at the route start, far from both POIs
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: routeWithPoi.startPoint.lat,
        longitude: routeWithPoi.startPoint.lng,
        accuracy: 5,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
      async (_opts: unknown, cb: (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void) => {
        cb({ coords: { latitude: routeWithPoi.startPoint.lat, longitude: routeWithPoi.startPoint.lng, accuracy: 5 } });
        return { remove: jest.fn() };
      }
    );

    const { result } = renderHook(() =>
      useLiveMapRideState(routeWithPoi.id, routeWithPoi)
    );

    await waitFor(() => {
      expect(result.current.routeLoading).toBe(false);
    });

    expect(result.current.visitedPoiIndices.size).toBe(0);
  });
});
