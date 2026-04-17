import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { mockRoutes } from '../app/types';
import { STORAGE_KEYS } from '../constants/routeStorage';
import {
  BACKGROUND_RIDE_TRACKING_TASK,
} from './backgroundRideTracking';
import { saveActiveRideSession } from './activeRideSession';
import { notifyCheckpointReachedInBackground, notifyRideCompletedInBackground } from './rideNotifications';
import { saveRide } from './rideService';

jest.mock('./rideService', () => ({
  saveRide: jest.fn(async () => ({ id: 'ride-1' })),
}));

jest.mock('./rideNotifications', () => ({
  notifyCheckpointReachedInBackground: jest.fn(async () => undefined),
  notifyRideCompletedInBackground: jest.fn(async () => undefined),
}));

describe('backgroundRideTracking', () => {
  const route = mockRoutes[1];
  const defineTask = TaskManager.defineTask as jest.Mock;
  const taskRegistration = defineTask.mock.calls.find(
    ([taskName]) => taskName === BACKGROUND_RIDE_TRACKING_TASK,
  );
  const taskHandler = taskRegistration?.[1] as ((input: any) => Promise<void>) | undefined;

  beforeEach(async () => {
    (saveRide as jest.Mock).mockClear();
    (notifyCheckpointReachedInBackground as jest.Mock).mockClear();
    (notifyRideCompletedInBackground as jest.Mock).mockClear();
    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValue(false);
    (Location.stopLocationUpdatesAsync as jest.Mock).mockClear();
    await AsyncStorage.clear();
  });

  it('sends a background checkpoint notification when a new checkpoint is reached', async () => {
    if (!taskHandler) {
      throw new Error('Background ride task was not registered');
    }
    const checkpoint = route.checkpoints[1];

    await saveActiveRideSession({
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-17T00:00:00.000Z',
      progressPct: 70,
      lastCheckpointIndexNotified: 0,
      lastKnownPosition: {
        lat: checkpoint.lat,
        lng: checkpoint.lng,
      },
    });

    await taskHandler({
      data: {
        locations: [
          {
            coords: {
              latitude: checkpoint.lat,
              longitude: checkpoint.lng,
              accuracy: 5,
            },
          },
        ],
      },
    });

    expect(notifyCheckpointReachedInBackground).toHaveBeenCalledWith(
      route.name,
      checkpoint.name,
    );

    const persisted = JSON.parse(
      (await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession)) as string,
    );
    expect(persisted.lastCheckpointIndexNotified).toBe(2);
  });

  it('stops tracking, saves the ride, and notifies completion in the background', async () => {
    if (!taskHandler) {
      throw new Error('Background ride task was not registered');
    }

    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(true);

    await saveActiveRideSession({
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-17T00:00:00.000Z',
      progressPct: 94,
      lastKnownPosition: {
        lat: route.checkpoints[route.checkpoints.length - 1].lat,
        lng: route.checkpoints[route.checkpoints.length - 1].lng,
      },
      distanceKm: route.distance - 0.2,
    });

    await taskHandler({
      data: {
        locations: [
          {
            coords: {
              latitude: route.endPoint.lat,
              longitude: route.endPoint.lng,
              accuracy: 5,
            },
          },
        ],
      },
    });

    expect(saveRide).toHaveBeenCalledWith(
      expect.objectContaining({
        route,
        checkpointsVisited: route.checkpoints.length,
      }),
    );
    expect(notifyRideCompletedInBackground).toHaveBeenCalledWith(
      route,
      expect.objectContaining({
        checkpointsVisited: route.checkpoints.length,
      }),
    );
    expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(
      BACKGROUND_RIDE_TRACKING_TASK,
    );
    expect(await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession)).toBeNull();
  });

  it('completes the ride from the raw endpoint geofence even when snapped progress does not advance', async () => {
    if (!taskHandler) {
      throw new Error('Background ride task was not registered');
    }

    const detachedEndRoute = {
      ...route,
      id: 'detached-end-route',
      distance: 0.3,
      routePath: [
        { lat: route.startPoint.lat, lng: route.startPoint.lng },
        { lat: route.checkpoints[0].lat, lng: route.checkpoints[0].lng },
      ],
      endPoint: {
        ...route.endPoint,
        lat: route.checkpoints[0].lat + 0.0005,
        lng: route.checkpoints[0].lng + 0.0005,
        name: 'Detached endpoint',
      },
    };

    (Location.hasStartedLocationUpdatesAsync as jest.Mock).mockResolvedValueOnce(true);

    await saveActiveRideSession({
      version: 1,
      routeId: detachedEndRoute.id,
      route: detachedEndRoute,
      startedAt: '2026-04-17T00:00:00.000Z',
      progressPct: 40,
      lastKnownPosition: {
        lat: detachedEndRoute.startPoint.lat,
        lng: detachedEndRoute.startPoint.lng,
      },
      distanceKm: 0,
    });

    await taskHandler({
      data: {
        locations: [
          {
            coords: {
              latitude: detachedEndRoute.endPoint.lat,
              longitude: detachedEndRoute.endPoint.lng,
              accuracy: 5,
            },
          },
        ],
      },
    });

    expect(saveRide).toHaveBeenCalledWith(
      expect.objectContaining({
        route: detachedEndRoute,
      }),
    );
    expect(notifyRideCompletedInBackground).toHaveBeenCalledWith(
      detachedEndRoute,
      expect.any(Object),
    );
    expect(await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession)).toBeNull();
  });
});
