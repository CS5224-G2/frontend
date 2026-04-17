import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { STORAGE_KEYS } from '../constants/routeStorage';
import {
  clearRideNotifications,
  extractRideCompletionNotificationData,
  notifyCheckpointReachedInBackground,
  notifyRideCompletedInBackground,
  notifyRideTrackingInBackground,
  scheduleSimulationProgressNotifications,
} from './rideNotifications';
import { saveActiveRideSession } from './activeRideSession';

describe('rideNotifications', () => {
  const route = {
    id: 'route-1',
    name: 'Test Route',
    description: 'Test route description',
    distance: 12.5,
    elevation: 10,
    estimatedTime: 45,
    rating: 4.5,
    reviewCount: 12,
    startPoint: { lat: 1.3, lng: 103.7, name: 'Start' },
    endPoint: { lat: 1.31, lng: 103.71, name: 'End' },
    checkpoints: [],
    cyclistType: 'general' as const,
    shade: 50,
    airQuality: 70,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await saveActiveRideSession({
      version: 1,
      routeId: route.id,
      route,
      startedAt: '2026-04-08T00:00:00.000Z',
    });
  });

  it('stores delivered ride notification ids so they can be cleared later', async () => {
    await notifyRideTrackingInBackground('Test Route');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.rideNotificationIds)).toBe(
      JSON.stringify(['notification-id']),
    );
  });

  it('dismisses and clears tracked ride notifications', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.rideNotificationIds,
      JSON.stringify(['notification-a', 'notification-b']),
    );

    await clearRideNotifications();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification-a');
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('notification-b');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-a');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-b');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.rideNotificationIds)).toBeNull();
  });

  it('does not schedule ride notifications once the active session is gone', async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.activeRideSession);

    await notifyRideTrackingInBackground('Test Route');

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules a loud background checkpoint notification', async () => {
    await notifyCheckpointReachedInBackground('Test Route', 'Checkpoint Alpha');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Checkpoint reached',
          body: 'Test Route: Checkpoint Alpha',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          interruptionLevel: 'timeSensitive',
        }),
      }),
    );
  });

  it('embeds feedback payload in the ride completion notification', async () => {
    await notifyRideCompletedInBackground(route as any, {
      distanceKm: 12.5,
      elapsedMinutes: 48,
      checkpointsVisited: 2,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Ride complete',
          data: expect.objectContaining({
            kind: 'ride-completed-feedback',
            routeId: route.id,
          }),
        }),
      }),
    );
  });

  it('parses completion notification payloads for feedback navigation', () => {
    expect(
      extractRideCompletionNotificationData({
        kind: 'ride-completed-feedback',
        routeId: route.id,
        route,
        rideSummary: {
          distanceKm: 12.5,
          elapsedMinutes: 48,
          checkpointsVisited: 2,
        },
      }),
    ).toEqual({
      kind: 'ride-completed-feedback',
      routeId: route.id,
      route,
      rideSummary: {
        distanceKm: 12.5,
        elapsedMinutes: 48,
        checkpointsVisited: 2,
      },
    });
  });

  it('schedules upcoming checkpoint and completion notifications for simulation mode', async () => {
    const simulatedRoute = {
      ...route,
      id: 'route-sim',
      checkpoints: [
        { id: 'cp-1', name: 'Checkpoint One', lat: 1.301, lng: 103.701, description: 'First' },
        { id: 'cp-2', name: 'Checkpoint Two', lat: 1.302, lng: 103.702, description: 'Second' },
      ],
    };

    await saveActiveRideSession({
      version: 1,
      routeId: simulatedRoute.id,
      route: simulatedRoute,
      startedAt: '2026-04-08T00:00:00.000Z',
    });

    await scheduleSimulationProgressNotifications(simulatedRoute as any, 40, 20);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Checkpoint reached',
          body: `${simulatedRoute.name}: Checkpoint Two`,
        }),
        trigger: expect.objectContaining({
          seconds: 14,
        }),
      }),
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Ride complete',
          data: expect.objectContaining({
            kind: 'ride-completed-feedback',
            routeId: simulatedRoute.id,
          }),
        }),
        trigger: expect.objectContaining({
          seconds: 30,
        }),
      }),
    );
  });
});
