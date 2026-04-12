import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Route } from '../../../shared/types/index';
import { deleteSavedRoute, getRouteById, getSavedRoutes, saveRoute, type SavedRoute } from './routeService';

export const FAVORITE_ROUTES_KEY = 'favoriteRoutes';
export const FAVORITE_SAVED_ROUTES_KEY = 'favoriteSavedRoutes';
export const MAX_FAVORITE_ROUTES = 3;

function dedupeFavoriteRouteIds(routeIds: string[]): string[] {
  const uniqueIds: string[] = [];
  const seenRouteIds = new Set<string>();

  for (const routeId of routeIds) {
    if (typeof routeId !== 'string' || !routeId || seenRouteIds.has(routeId)) {
      continue;
    }

    seenRouteIds.add(routeId);
    uniqueIds.push(routeId);

    if (uniqueIds.length >= MAX_FAVORITE_ROUTES) {
      break;
    }
  }

  return uniqueIds;
}

function parseFavoriteRouteIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? dedupeFavoriteRouteIds(parsed) : [];
  } catch {
    return [];
  }
}

function isSavedRoute(value: unknown): value is SavedRoute {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SavedRoute>;
  return (
    typeof candidate.savedRouteId === 'string' &&
    typeof candidate.savedAt === 'string' &&
    Boolean(candidate.route && typeof candidate.route === 'object')
  );
}

function parseSavedRoutes(value: string | null): SavedRoute[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSavedRoute).slice(0, MAX_FAVORITE_ROUTES);
  } catch {
    return [];
  }
}

async function persistSavedRoutes(savedRoutes: SavedRoute[]): Promise<void> {
  const normalized = savedRoutes.slice(0, MAX_FAVORITE_ROUTES);
  const routeIds = dedupeFavoriteRouteIds(normalized.map((savedRoute) => savedRoute.route.id));

  await Promise.all([
    AsyncStorage.setItem(FAVORITE_ROUTES_KEY, JSON.stringify(routeIds)),
    AsyncStorage.setItem(FAVORITE_SAVED_ROUTES_KEY, JSON.stringify(normalized)),
  ]);
}

export async function getLocalFavoriteRouteIds(): Promise<string[]> {
  const saved = await AsyncStorage.getItem(FAVORITE_ROUTES_KEY);
  return parseFavoriteRouteIds(saved);
}

export async function getLocalSavedRoutes(): Promise<SavedRoute[]> {
  const saved = await AsyncStorage.getItem(FAVORITE_SAVED_ROUTES_KEY);
  return parseSavedRoutes(saved);
}

export async function syncFavoriteRoutesFromBackend(): Promise<SavedRoute[]> {
  const backendSavedRoutes = await getSavedRoutes();
  await persistSavedRoutes(backendSavedRoutes);
  return backendSavedRoutes;
}

export async function addFavoriteRouteByRouteId(routeId: string): Promise<void> {
  const route = await getRouteById(routeId);
  if (!route) {
    throw new Error('Unable to load route details.');
  }

  await saveRoute(route);
  await syncFavoriteRoutesFromBackend();
}

export async function removeFavoriteRouteByRouteId(routeId: string): Promise<void> {
  let savedRoutes = await getLocalSavedRoutes();
  let target = savedRoutes.find((savedRoute) => savedRoute.route.id === routeId);

  if (!target) {
    savedRoutes = await syncFavoriteRoutesFromBackend();
    target = savedRoutes.find((savedRoute) => savedRoute.route.id === routeId);
  }

  if (!target) {
    throw new Error('Saved route id not found.');
  }

  await deleteSavedRoute(target.savedRouteId);
  await syncFavoriteRoutesFromBackend();
}

export async function loadFavoriteRoutesFromLocalCache(): Promise<Route[]> {
  const savedRoutes = await getLocalSavedRoutes();
  return savedRoutes.map((savedRoute) => savedRoute.route);
}
