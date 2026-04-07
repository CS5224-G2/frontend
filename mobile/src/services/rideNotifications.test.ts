import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { STORAGE_KEYS } from '../constants/routeStorage';
import {
  clearRideNotifications,
  notifyRideTrackingInBackground,
} from './rideNotifications';

describe('rideNotifications', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
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
});
