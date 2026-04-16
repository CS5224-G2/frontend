import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '../constants/routeStorage';
import { loadActiveRideSession } from './activeRideSession';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let notificationHandlerConfigured = false;

function isExpoGoAndroidNotificationsUnavailable(): boolean {
  return (
    Platform.OS === 'android' &&
    (Constants.executionEnvironment === 'storeClient' ||
      (Constants as typeof Constants & { appOwnership?: string }).appOwnership === 'expo')
  );
}

function getNotificationsModule(): NotificationsModule | null {
  if (isExpoGoAndroidNotificationsUnavailable()) {
    return null;
  }

  if (notificationsModule === undefined) {
    try {
      notificationsModule = require('expo-notifications') as NotificationsModule;
    } catch {
      notificationsModule = null;
    }
  }

  if (notificationsModule && !notificationHandlerConfigured) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notificationsModule ?? null;
}

export function initializeRideNotifications(): void {
  getNotificationsModule();
}

async function ensureRideNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return (
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function sendRideNotification(title: string, body: string): Promise<void> {
  const granted = await ensureRideNotificationPermission();
  if (!granted) {
    return;
  }

  const activeSession = await loadActiveRideSession();
  if (!activeSession) {
    return;
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: false,
    },
    trigger: null,
  });

  const existingIds = await AsyncStorage.getItem(STORAGE_KEYS.rideNotificationIds);
  const parsedIds = existingIds ? (JSON.parse(existingIds) as string[]) : [];
  const nextIds = Array.from(new Set([...parsedIds, id]));
  await AsyncStorage.setItem(STORAGE_KEYS.rideNotificationIds, JSON.stringify(nextIds));
}

export async function notifyRideTrackingInBackground(routeName: string): Promise<void> {
  await sendRideNotification(
    'Ride tracking active',
    `${routeName} is still being tracked while the app is in the background.`,
  );
}

export async function notifyRidePaused(routeName: string): Promise<void> {
  await sendRideNotification(
    'Ride paused',
    `${routeName} is paused. Open CycleLink to resume your ride.`,
  );
}

export async function notifyRideResumed(routeName: string): Promise<void> {
  await sendRideNotification(
    'Ride resumed',
    `${routeName} is tracking again.`,
  );
}

export async function clearRideNotifications(): Promise<void> {
  const existingIds = await AsyncStorage.getItem(STORAGE_KEYS.rideNotificationIds);
  const parsedIds = existingIds ? (JSON.parse(existingIds) as string[]) : [];
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    await AsyncStorage.removeItem(STORAGE_KEYS.rideNotificationIds);
    return;
  }

  await Promise.all(
    parsedIds.flatMap((id) => [
      Notifications.dismissNotificationAsync(id).catch(() => {}),
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ]),
  );

  await Notifications.dismissAllNotificationsAsync().catch(() => {});
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  await AsyncStorage.removeItem(STORAGE_KEYS.rideNotificationIds);
}

export { ensureRideNotificationPermission };
