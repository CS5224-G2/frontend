import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Route } from '../../../shared/types/index';
import { STORAGE_KEYS } from '../constants/routeStorage';
import {
  haversineDistanceKm,
  projectPointOntoRoute,
  routeToLineCoordinates,
  type LngLat,
} from '@/utils/routeGeometry';

const ROUTE_MATCH_THRESHOLD_METERS = 40;

export type ActiveRideSession = {
  version: 1;
  routeId: string;
  route: Route;
  startedAt: string;
  status?: 'active' | 'paused';
  pausedAt?: string;
  totalPausedMs?: number;
  lastKnownPosition?: { lat: number; lng: number };
  distanceKm?: number;
  progressPct?: number;
  lastCheckpointIndexNotified?: number;
  /** Indices of route.pointsOfInterestVisited that have already triggered a notification. */
  lastPoiIndicesNotified?: number[];
};

function normalizeActiveRideSession(session: ActiveRideSession): ActiveRideSession {
  return {
    ...session,
    status: session.status === 'paused' ? 'paused' : 'active',
    pausedAt: session.status === 'paused' && typeof session.pausedAt === 'string' ? session.pausedAt : undefined,
    totalPausedMs:
      typeof session.totalPausedMs === 'number' && Number.isFinite(session.totalPausedMs)
        ? Math.max(0, session.totalPausedMs)
        : 0,
    lastCheckpointIndexNotified:
      typeof session.lastCheckpointIndexNotified === 'number' &&
      Number.isFinite(session.lastCheckpointIndexNotified)
        ? Math.max(0, Math.floor(session.lastCheckpointIndexNotified))
        : undefined,
  };
}

function isValidActiveRideSession(value: unknown): value is ActiveRideSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ActiveRideSession>;
  return (
    candidate.version === 1 &&
    typeof candidate.routeId === 'string' &&
    typeof candidate.startedAt === 'string' &&
    Boolean(candidate.route && typeof candidate.route === 'object')
  );
}

export async function loadActiveRideSession(): Promise<ActiveRideSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.activeRideSession);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidActiveRideSession(parsed) ? normalizeActiveRideSession(parsed) : null;
  } catch {
    return null;
  }
}

export async function saveActiveRideSession(session: ActiveRideSession): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.activeRideSession,
    JSON.stringify(normalizeActiveRideSession(session)),
  );
}

export async function clearActiveRideSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.activeRideSession);
}

export function advanceActiveRideSession(
  session: ActiveRideSession,
  nextPosition: { lat: number; lng: number },
  accuracyMeters?: number | null,
): ActiveRideSession {
  if (session.status === 'paused') {
    return normalizeActiveRideSession(session);
  }

  if (typeof accuracyMeters === 'number' && accuracyMeters > 100) {
    return normalizeActiveRideSession(session);
  }

  const routeCoords = routeToLineCoordinates(session.route);
  const nextLngLat: LngLat = [nextPosition.lng, nextPosition.lat];
  const projected = routeCoords.length
    ? projectPointOntoRoute(routeCoords, nextLngLat)
    : { snappedPoint: nextLngLat, progress: 0, distanceKmFromRoute: 0 };

  if (
    routeCoords.length >= 2 &&
    projected.distanceKmFromRoute * 1000 > ROUTE_MATCH_THRESHOLD_METERS
  ) {
    return normalizeActiveRideSession(session);
  }

  const acceptedPoint = projected.snappedPoint;
  const previousLngLat: LngLat | null = session.lastKnownPosition
    ? [session.lastKnownPosition.lng, session.lastKnownPosition.lat]
    : null;

  const incrementKm =
    previousLngLat === null ? 0 : haversineDistanceKm(previousLngLat, acceptedPoint);
  const acceptedIncrementKm =
    incrementKm >= 0.003 && incrementKm <= 0.5 ? incrementKm : 0;

  return {
    ...normalizeActiveRideSession(session),
    lastKnownPosition: {
      lat: acceptedPoint[1],
      lng: acceptedPoint[0],
    },
    distanceKm: Number(((session.distanceKm ?? 0) + acceptedIncrementKm).toFixed(3)),
    progressPct: Math.max(session.progressPct ?? 0, projected.progress * 100),
  };
}

export function pauseActiveRideSession(
  session: ActiveRideSession,
  pausedAt: string,
): ActiveRideSession {
  if (session.status === 'paused') {
    return normalizeActiveRideSession(session);
  }

  return normalizeActiveRideSession({
    ...session,
    status: 'paused',
    pausedAt,
  });
}

export function resumeActiveRideSession(
  session: ActiveRideSession,
  resumedAt: string,
): ActiveRideSession {
  if (session.status !== 'paused' || !session.pausedAt) {
    return normalizeActiveRideSession({
      ...session,
      status: 'active',
      pausedAt: undefined,
    });
  }

  const pausedAtMs = Date.parse(session.pausedAt);
  const resumedAtMs = Date.parse(resumedAt);
  const pausedIncrementMs =
    Number.isNaN(pausedAtMs) || Number.isNaN(resumedAtMs)
      ? 0
      : Math.max(0, resumedAtMs - pausedAtMs);

  return normalizeActiveRideSession({
    ...session,
    status: 'active',
    pausedAt: undefined,
    totalPausedMs: (session.totalPausedMs ?? 0) + pausedIncrementMs,
  });
}
