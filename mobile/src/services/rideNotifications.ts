import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureRideNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function sendRideNotification(title: string, body: string): Promise<void> {
  const granted = await ensureRideNotificationPermission();
  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: false,
    },
    trigger: null,
  });
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
  await Notifications.dismissAllNotificationsAsync();
}

export { ensureRideNotificationPermission };
