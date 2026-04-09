import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFavoriteRouteIdsLocal, setFavoriteRouteIdsLocal } from './localDb';

const LEGACY_FAVORITE_ROUTES_KEY = 'favoriteRoutes';
let favoriteRouteMigrationPromise: Promise<string[]> | null = null;

function normalizeFavoriteRouteIds(routeIds: unknown): string[] {
  if (!Array.isArray(routeIds)) {
    return [];
  }

  return [...new Set(routeIds.filter((routeId): routeId is string => typeof routeId === 'string'))];
}

function parseLegacyFavoriteRouteIds(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    return normalizeFavoriteRouteIds(JSON.parse(value));
  } catch {
    return [];
  }
}

export async function getFavoriteRouteIds(): Promise<string[]> {
  const localIds = normalizeFavoriteRouteIds(await getFavoriteRouteIdsLocal());
  if (localIds.length > 0) {
    return localIds;
  }

  if (favoriteRouteMigrationPromise) {
    return favoriteRouteMigrationPromise;
  }

  favoriteRouteMigrationPromise = (async () => {
    const legacyIds = parseLegacyFavoriteRouteIds(
      typeof AsyncStorage.getItem === 'function'
        ? await AsyncStorage.getItem(LEGACY_FAVORITE_ROUTES_KEY)
        : null,
    );

    if (legacyIds.length === 0) {
      return [];
    }

    await setFavoriteRouteIdsLocal(legacyIds);
    if (typeof AsyncStorage.removeItem === 'function') {
      await AsyncStorage.removeItem(LEGACY_FAVORITE_ROUTES_KEY);
    }
    return legacyIds;
  })();

  try {
    return await favoriteRouteMigrationPromise;
  } finally {
    favoriteRouteMigrationPromise = null;
  }
}

export async function setFavoriteRouteIds(routeIds: string[]): Promise<string[]> {
  const normalizedIds = normalizeFavoriteRouteIds(routeIds);
  return setFavoriteRouteIdsLocal(normalizedIds);
}

export async function seedFavoriteRouteIdsIfEmpty(defaultRouteIds: string[]): Promise<void> {
  const existingIds = await getFavoriteRouteIds();
  if (existingIds.length === 0 && defaultRouteIds.length > 0) {
    await setFavoriteRouteIds(defaultRouteIds);
  }
}
