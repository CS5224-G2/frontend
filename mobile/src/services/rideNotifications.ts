import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Route } from '../../../shared/types/index';
import { STORAGE_KEYS } from '../constants/routeStorage';
import { loadActiveRideSession } from './activeRideSession';

type NotificationsModule = typeof import('expo-notifications');

const RIDE_ALERTS_CHANNEL_ID = 'ride-alerts';
const CHECKPOINT_NOTIFICATION_KIND = 'ride-checkpoint';
const COMPLETION_NOTIFICATION_KIND = 'ride-completed-feedback';

export type RideFeedbackSummary = {
  distanceKm: number;
  elapsedMinutes: number;
  checkpointsVisited: number;
};

export type RideCompletionNotificationData = {
  kind: typeof COMPLETION_NOTIFICATION_KIND;
  routeId: string;
  route: Route;
  rideSummary: RideFeedbackSummary;
};

let notificationsModule: NotificationsModule | null | undefined;
let notificationHandlerConfigured = false;
let notificationChannelConfigured = false;

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

async function ensureRideNotificationChannel(): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications || Platform.OS !== 'android' || notificationChannelConfigured) {
    return;
  }

  await Notifications.setNotificationChannelAsync(RIDE_ALERTS_CHANNEL_ID, {
    name: 'Ride alerts',
    importance: Notifications.AndroidImportance.MAX,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
    vibrationPattern: [0, 300, 200, 300],
    sound: 'default',
    enableLights: true,
    lightColor: '#2563eb',
    showBadge: true,
  });
  notificationChannelConfigured = true;
}

export function initializeRideNotifications(): void {
  getNotificationsModule();
  void ensureRideNotificationChannel().catch(() => {});
}

async function ensureRideNotificationPermission(): Promise<boolean> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      await ensureRideNotificationChannel().catch(() => {});
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    await ensureRideNotificationChannel().catch(() => {});
    return (
      requested.granted ||
      requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function sendRideNotification(
  title: string,
  body: string,
  options?: {
    data?: Record<string, unknown>;
    loud?: boolean;
  },
): Promise<void> {
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
      data: options?.data,
      sound: options?.loud ? 'default' : false,
      vibrate: options?.loud ? [0, 300, 200, 300] : undefined,
      priority: options?.loud
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.DEFAULT,
      interruptionLevel: options?.loud ? 'timeSensitive' : 'active',
    },
    trigger:
      Platform.OS === 'android'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            channelId: RIDE_ALERTS_CHANNEL_ID,
          }
        : null,
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

export async function notifyCheckpointReachedInBackground(
  routeName: string,
  checkpointName: string,
): Promise<void> {
  await sendRideNotification(
    'Checkpoint reached',
    `${routeName}: ${checkpointName}`,
    {
      loud: true,
      data: {
        kind: CHECKPOINT_NOTIFICATION_KIND,
      },
    },
  );
}

export async function notifyRideCompletedInBackground(
  route: Route,
  rideSummary: RideFeedbackSummary,
): Promise<void> {
  const data: RideCompletionNotificationData = {
    kind: COMPLETION_NOTIFICATION_KIND,
    routeId: route.id,
    route,
    rideSummary,
  };

  await sendRideNotification(
    'Ride complete',
    `${route.name} is done. Tap to leave feedback.`,
    { data, loud: true },
  );
}

export function extractRideCompletionNotificationData(
  value: unknown,
): RideCompletionNotificationData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const data = value as Partial<RideCompletionNotificationData>;
  if (
    data.kind !== COMPLETION_NOTIFICATION_KIND ||
    typeof data.routeId !== 'string' ||
    !data.route ||
    typeof data.route !== 'object' ||
    !data.rideSummary ||
    typeof data.rideSummary !== 'object'
  ) {
    return null;
  }

  const summary = data.rideSummary as Partial<RideFeedbackSummary>;
  if (
    typeof summary.distanceKm !== 'number' ||
    typeof summary.elapsedMinutes !== 'number' ||
    typeof summary.checkpointsVisited !== 'number'
  ) {
    return null;
  }

  return {
    kind: COMPLETION_NOTIFICATION_KIND,
    routeId: data.routeId,
    route: data.route as Route,
    rideSummary: {
      distanceKm: summary.distanceKm,
      elapsedMinutes: summary.elapsedMinutes,
      checkpointsVisited: summary.checkpointsVisited,
    },
  };
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
