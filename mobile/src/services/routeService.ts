// =============================================================================
// ROUTE SERVICE — Mobile (Expo/React Native)
// Centralises all Route data access. UI components MUST use this service —
// they must NOT import mock data or call fetch directly.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { Route, UserPreferences } from '../../../shared/types/index';
import { USE_MOCKS } from '../config/runtime';
import { getLocalDb } from './localDb';

export type { Route };

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendCheckpoint = {
  checkpoint_id: string;
  checkpoint_name: string;
  latitude: number;
  longitude: number;
  description: string;
};

type BackendRoute = {
  route_id: string;
  route_name: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  estimated_time_min: number;
  rating: number;
  review_count: number;
  start_point: { lat: number; lng: number; name: string };
  end_point: { lat: number; lng: number; name: string };
  checkpoints: BackendCheckpoint[];
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  shade_pct: number;
  air_quality_index: number;
};

type LocalRouteRow = {
  id: string;
  name: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  estimated_time_min: number;
  rating: number;
  review_count: number;
  start_lat: number;
  start_lng: number;
  start_name: string;
  end_lat: number;
  end_lng: number;
  end_name: string;
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  shade_pct: number;
  air_quality_index: number;
};

type LocalCheckpointRow = {
  id: string;
  route_id: string;
  sort_order: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

const toFrontendRoute = (r: BackendRoute): Route => ({
  id: r.route_id,
  name: r.route_name,
  description: r.description,
  distance: r.distance_km,
  elevation: r.elevation_m,
  estimatedTime: r.estimated_time_min,
  rating: r.rating,
  reviewCount: r.review_count,
  startPoint: r.start_point,
  endPoint: r.end_point,
  checkpoints: r.checkpoints.map((cp) => ({
    id: cp.checkpoint_id,
    name: cp.checkpoint_name,
    lat: cp.latitude,
    lng: cp.longitude,
    description: cp.description,
  })),
  cyclistType: r.cyclist_type,
  shade: r.shade_pct,
  airQuality: r.air_quality_index,
});

const toFrontendRouteFromLocalRows = (
  route: LocalRouteRow,
  checkpoints: LocalCheckpointRow[],
): Route => ({
  id: route.id,
  name: route.name,
  description: route.description,
  distance: route.distance_km,
  elevation: route.elevation_m,
  estimatedTime: route.estimated_time_min,
  rating: route.rating,
  reviewCount: route.review_count,
  startPoint: {
    lat: route.start_lat,
    lng: route.start_lng,
    name: route.start_name,
  },
  endPoint: {
    lat: route.end_lat,
    lng: route.end_lng,
    name: route.end_name,
  },
  checkpoints: checkpoints.map((checkpoint) => ({
    id: checkpoint.id,
    name: checkpoint.name,
    lat: checkpoint.lat,
    lng: checkpoint.lng,
    description: checkpoint.description,
  })),
  cyclistType: route.cyclist_type,
  shade: route.shade_pct,
  airQuality: route.air_quality_index,
});

async function loadCheckpoints(routeId: string): Promise<LocalCheckpointRow[]> {
  const db = await getLocalDb();
  return db.getAllAsync<LocalCheckpointRow>(
    `SELECT
      id,
      route_id,
      sort_order,
      name,
      lat,
      lng,
      description
    FROM route_checkpoints
    WHERE route_id = ?
    ORDER BY sort_order ASC`,
    routeId,
  );
}

async function buildRoute(route: LocalRouteRow): Promise<Route> {
  const checkpoints = await loadCheckpoints(route.id);
  return toFrontendRouteFromLocalRows(route, checkpoints);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all available routes, optionally filtered by preferences. */
export async function getRoutes(prefs?: UserPreferences, token?: string): Promise<Route[]> {
  if (USE_MOCKS) {
    await wait(300);
    const db = await getLocalDb();
    const rows = prefs
      ? await db.getAllAsync<LocalRouteRow>(
          `SELECT
            id,
            name,
            description,
            distance_km,
            elevation_m,
            estimated_time_min,
            rating,
            review_count,
            start_lat,
            start_lng,
            start_name,
            end_lat,
            end_lng,
            end_name,
            cyclist_type,
            shade_pct,
            air_quality_index
          FROM routes
          WHERE cyclist_type = ?
            AND distance_km <= ?
            AND air_quality_index >= ?
          ORDER BY rating DESC, review_count DESC`,
          prefs.cyclistType,
          prefs.distance * 1.5,
          prefs.airQuality - 20,
        )
      : await db.getAllAsync<LocalRouteRow>(
          `SELECT
            id,
            name,
            description,
            distance_km,
            elevation_m,
            estimated_time_min,
            rating,
            review_count,
            start_lat,
            start_lng,
            start_name,
            end_lat,
            end_lng,
            end_name,
            cyclist_type,
            shade_pct,
            air_quality_index
          FROM routes
          ORDER BY rating DESC, review_count DESC`,
        );

    return Promise.all(rows.map(buildRoute));
  }

  const qs = prefs
    ? `?cyclist_type=${prefs.cyclistType}&max_distance=${prefs.distance * 1.5}&min_air_quality=${prefs.airQuality - 20}`
    : '';
  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendRoute[]>(`/routes${qs}`, token);
  return response.map(toFrontendRoute);
}

/** Fetch a single route by ID. */
export async function getRouteById(id: string, token?: string): Promise<Route | null> {
  if (USE_MOCKS) {
    await wait(200);
    const db = await getLocalDb();
    const row = await db.getFirstAsync<LocalRouteRow>(
      `SELECT
        id,
        name,
        description,
        distance_km,
        elevation_m,
        estimated_time_min,
        rating,
        review_count,
        start_lat,
        start_lng,
        start_name,
        end_lat,
        end_lng,
        end_name,
        cyclist_type,
        shade_pct,
        air_quality_index
      FROM routes
      WHERE id = ?`,
      id,
    );

    return row ? buildRoute(row) : null;
  }

  try {
    const { httpClient } = await import('./httpClient');
    const response = await httpClient.get<BackendRoute>(`/routes/${id}`, token);
    return toFrontendRoute(response);
  } catch {
    return null;
  }
}

/**
 * Get AI/algorithm-recommended routes ranked by match score against user preferences.
 * Returns up to `limit` routes.
 */
export async function getRouteRecommendations(
  prefs: UserPreferences,
  limit = 3,
  token?: string,
): Promise<Route[]> {
  if (USE_MOCKS) {
    await wait(400);
    const routes = await getRoutes(undefined, token);
    return routes
      .sort((a, b) => {
        const scoreA = _calculateMatchScore(a, prefs);
        const scoreB = _calculateMatchScore(b, prefs);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  const { httpClient } = await import('./httpClient');
  const payload = {
    cyclist_type: prefs.cyclistType,
    preferred_shade: prefs.preferredShade,
    elevation_preference: prefs.elevation,
    preferred_distance_km: prefs.distance,
    min_air_quality: prefs.airQuality,
    limit,
  };
  const response = await httpClient.post<BackendRoute[]>('/routes/recommendations', payload, token);
  return response.map(toFrontendRoute);
}

/** Internal match-score helper (mirrors HomePage logic, centralised here). */
function _calculateMatchScore(route: Route, prefs: UserPreferences): number {
  let score = route.rating * 10 + Math.min(route.reviewCount / 100, 10);
  if (route.cyclistType === prefs.cyclistType) score += 20;
  score += Math.max(10 - Math.abs(route.distance - prefs.distance) / 2, 0);
  score += Math.max(10 - Math.abs(route.elevation - prefs.elevation * 3) / 30, 0);
  score += Math.max(10 - Math.abs(route.shade - prefs.preferredShade) / 10, 0);
  score += Math.max(10 - Math.abs(route.airQuality - prefs.airQuality) / 10, 0);
  return score;
}
