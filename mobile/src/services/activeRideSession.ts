import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Route } from '../../../shared/types/index';
import { STORAGE_KEYS } from '../constants/routeStorage';

export type ActiveRideSession = {
  version: 1;
  routeId: string;
  route: Route;
  startedAt: string;
  lastKnownPosition?: { lat: number; lng: number };
  distanceKm?: number;
  progressPct?: number;
};

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
    return isValidActiveRideSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveActiveRideSession(session: ActiveRideSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.activeRideSession, JSON.stringify(session));
}

export async function clearActiveRideSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.activeRideSession);
}
