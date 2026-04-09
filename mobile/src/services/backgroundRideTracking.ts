import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import {
  advanceActiveRideSession,
  clearActiveRideSession,
  loadActiveRideSession,
  saveActiveRideSession,
} from './activeRideSession';

export const BACKGROUND_RIDE_TRACKING_TASK = 'cyclelink-background-ride-tracking';

TaskManager.defineTask(BACKGROUND_RIDE_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[BackgroundRideTracking] Task error', error.message);
    return;
  }

  const session = await loadActiveRideSession();
  const locations = (data as { locations?: Array<{ coords?: { latitude: number; longitude: number; accuracy?: number | null } }> } | undefined)?.locations ?? [];

  if (!session || locations.length === 0) {
    return;
  }

  let nextSession = session;
  for (const location of locations) {
    const coords = location.coords;
    if (!coords) {
      continue;
    }
    nextSession = advanceActiveRideSession(
      nextSession,
      { lat: coords.latitude, lng: coords.longitude },
      coords.accuracy,
    );
  }

  await saveActiveRideSession(nextSession);
});

export async function ensureBackgroundRideTrackingStarted(): Promise<boolean> {
  const available = await Location.isBackgroundLocationAvailableAsync();
  if (!available) {
    return false;
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    return false;
  }

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_RIDE_TRACKING_TASK);
  if (alreadyStarted) {
    return true;
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_RIDE_TRACKING_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 5,
    timeInterval: 5000,
    deferredUpdatesDistance: 10,
    deferredUpdatesInterval: 15000,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'CycleLink ride tracking active',
      notificationBody: 'Tracking your ride in the background.',
      killServiceOnDestroy: false,
    },
    showsBackgroundLocationIndicator: true,
  });

  return true;
}

export async function stopBackgroundRideTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_RIDE_TRACKING_TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_RIDE_TRACKING_TASK);
  }
}

export async function clearRideSessionAndStopTracking(): Promise<void> {
  await stopBackgroundRideTracking();
  await clearActiveRideSession();
}
