import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import {
  advanceActiveRideSession,
  type ActiveRideSession,
  clearActiveRideSession,
  loadActiveRideSession,
  saveActiveRideSession,
} from './activeRideSession';
import { saveRide } from './rideService';
import {
  notifyCheckpointReachedInBackground,
  notifyPoiReachedInBackground,
  notifyRideCompletedInBackground,
  type RideFeedbackSummary,
} from './rideNotifications';
import { haversineDistanceKm } from '@/utils/routeGeometry';

export const BACKGROUND_RIDE_TRACKING_TASK = 'cyclelink-background-ride-tracking';

/** Radius within which a POI triggers a notification (80 m, same as foreground). */
const POI_PROXIMITY_KM = 0.08;
const ENDPOINT_COMPLETION_RADIUS_KM = 0.04;
const MIN_COMPLETION_MOVEMENT_KM = 0.02;

function getNewlyEnteredPoiIndices(
  session: ActiveRideSession,
): number[] {
  const pois = session.route.pointsOfInterestVisited ?? [];
  if (!pois.length || !session.lastKnownPosition) {
    return [];
  }

  const alreadyNotified = new Set(session.lastPoiIndicesNotified ?? []);
  const newIndices: number[] = [];

  pois.forEach((poi, index) => {
    if (alreadyNotified.has(index)) return;
    if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') return;
    const distKm = haversineDistanceKm(
      [session.lastKnownPosition!.lng, session.lastKnownPosition!.lat],
      [poi.lng, poi.lat],
    );
    if (distKm <= POI_PROXIMITY_KM) {
      newIndices.push(index);
    }
  });

  return newIndices;
}

function getCheckpointCount(session: ActiveRideSession): number {
  const checkpoints = session.route.checkpoints ?? [];
  if (!checkpoints.length) {
    return 0;
  }

  const threshold = 100 / (checkpoints.length + 1);
  return Math.min(checkpoints.length, Math.floor((session.progressPct ?? 0) / threshold));
}

function isRouteCompleted(
  session: ActiveRideSession,
  latestRawPosition?: { lat: number; lng: number } | null,
): boolean {
  const progressPct = session.progressPct ?? 0;
  if (progressPct >= 98) {
    return true;
  }

  const completionReference = latestRawPosition ?? session.lastKnownPosition;
  if (!completionReference) {
    return false;
  }

  const distanceToEndKm = haversineDistanceKm(
    [completionReference.lng, completionReference.lat],
    [session.route.endPoint.lng, session.route.endPoint.lat],
  );

  if (distanceToEndKm > ENDPOINT_COMPLETION_RADIUS_KM) {
    return false;
  }

  const distanceFromStartKm = haversineDistanceKm(
    [completionReference.lng, completionReference.lat],
    [session.route.startPoint.lng, session.route.startPoint.lat],
  );

  const completionMovementThresholdKm = Math.min(
    0.05,
    Math.max(session.route.distance * 0.1, MIN_COMPLETION_MOVEMENT_KM),
  );

  return (
    distanceFromStartKm >= completionMovementThresholdKm ||
    (session.distanceKm ?? 0) >= completionMovementThresholdKm
  );
}

function buildRideSummary(session: ActiveRideSession, completedAt: string): RideFeedbackSummary {
  const completedAtMs = Date.parse(completedAt);
  const startedAtMs = Date.parse(session.startedAt);
  const totalPausedMs = session.totalPausedMs ?? 0;
  const elapsedSec =
    Number.isNaN(completedAtMs) || Number.isNaN(startedAtMs)
      ? 0
      : Math.max(0, Math.floor((completedAtMs - startedAtMs - totalPausedMs) / 1000));

  return {
    distanceKm: session.route.distance,
    elapsedMinutes: Math.max(1, Math.round(elapsedSec / 60)),
    checkpointsVisited: session.route.checkpoints.length,
  };
}

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

  const previousCheckpointCount =
    session.lastCheckpointIndexNotified ?? getCheckpointCount(session);

  let nextSession = session;
  let latestRawPosition: { lat: number; lng: number } | null = null;
  for (const location of locations) {
    const coords = location.coords;
    if (!coords) {
      continue;
    }
    latestRawPosition = { lat: coords.latitude, lng: coords.longitude };
    nextSession = advanceActiveRideSession(
      nextSession,
      { lat: coords.latitude, lng: coords.longitude },
      coords.accuracy,
    );
  }

  if (isRouteCompleted(nextSession, latestRawPosition)) {
    const completedAt = new Date().toISOString();
    const rideSummary = buildRideSummary(nextSession, completedAt);

    try {
      const avgSpeed =
        rideSummary.elapsedMinutes > 0
          ? Number((rideSummary.distanceKm / (rideSummary.elapsedMinutes / 60)).toFixed(1))
          : 0;

      await saveRide({
        route: nextSession.route,
        startTime: nextSession.startedAt,
        endTime: completedAt,
        distance: rideSummary.distanceKm,
        avgSpeed,
        checkpointsVisited: rideSummary.checkpointsVisited,
        pointsOfInterestVisited: nextSession.route.pointsOfInterestVisited,
      });
    } catch (persistError) {
      console.warn('[BackgroundRideTracking] Failed to persist completed ride', persistError);
    }

    try {
      await notifyRideCompletedInBackground(nextSession.route, rideSummary);
    } catch (notifyError) {
      console.warn('[BackgroundRideTracking] Failed to notify completed ride', notifyError);
    }

    await stopBackgroundRideTracking().catch((stopError) => {
      console.warn('[BackgroundRideTracking] Failed to stop background tracking', stopError);
    });
    await clearActiveRideSession();
    return;
  }

  const currentCheckpointCount = getCheckpointCount(nextSession);
  if (currentCheckpointCount > previousCheckpointCount) {
    const latestCheckpoint = nextSession.route.checkpoints[currentCheckpointCount - 1];
    if (latestCheckpoint) {
      void notifyCheckpointReachedInBackground(nextSession.route.name, latestCheckpoint.name).catch(
        (notifyError) => {
          console.warn('[BackgroundRideTracking] Failed to notify checkpoint', notifyError);
        },
      );
    }
  }

  // POI proximity detection — fires once per POI, persisted across background wakeups
  const newPoiIndices = getNewlyEnteredPoiIndices(nextSession);
  if (newPoiIndices.length > 0) {
    const pois = nextSession.route.pointsOfInterestVisited ?? [];
    for (const poiIndex of newPoiIndices) {
      const poi = pois[poiIndex];
      if (poi) {
        void notifyPoiReachedInBackground(poi.name, poi.category ?? '').catch((notifyError) => {
          console.warn('[BackgroundRideTracking] Failed to notify POI', notifyError);
        });
      }
    }
  }

  const allNotifiedPoiIndices = Array.from(
    new Set([...(nextSession.lastPoiIndicesNotified ?? []), ...newPoiIndices]),
  );

  nextSession = {
    ...nextSession,
    lastCheckpointIndexNotified: currentCheckpointCount,
    lastPoiIndicesNotified: allNotifiedPoiIndices,
  };
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
