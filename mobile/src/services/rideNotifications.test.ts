import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '../constants/routeStorage';
import {
  clearRideNotifications,
  notifyRideTrackingInBackground,
} from './rideNotifications';
import { saveActiveRideSession } from './activeRideSession';

describe('rideNotifications', () => {
  const route = {
    id: 'route-1',
    name: 'Test Route',
    startPoint: { lat: 1.3, lng: 103.7 },
    endPoint: { lat: 1.31, lng: 103.71 },
    checkpoints: [],
  };
  const originalPlatform = Platform.OS;
  const constants = Constants as typeof Constants & {
    executionEnvironment?: string;
    appOwnership?: string;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    constants.executionEnvironment = 'standalone';
    constants.appOwnership = 'standalone';
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

  it('skips scheduling notifications on Android Expo Go', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    constants.executionEnvironment = 'storeClient';
    constants.appOwnership = 'expo';

    await notifyRideTrackingInBackground('Test Route');

    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
