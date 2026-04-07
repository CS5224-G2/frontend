import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { STORAGE_KEYS } from '../../constants/routeStorage';
import { mockRoutes } from '../types';
import { useLiveMapRideState } from './useLiveMapRideState';

const mockNavigate = jest.fn();
let mockLiveMapProgressSimulationEnabled = false;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
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

    expect(mockNavigate).toHaveBeenCalledWith('RouteFeedback', {
      routeId: route.id,
      route,
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
});
