// =============================================================================
// ROUTE SERVICE — Mobile (Expo/React Native)
// Centralises all Route data access. UI components MUST use this service —
// they must NOT import mock data or call fetch directly.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { Route, UserPreferences } from '../../../shared/types/index';
import { mockRoutes } from '../../../shared/mocks/index';

export type { Route };

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all available routes, optionally filtered by preferences. */
export async function getRoutes(prefs?: UserPreferences, token?: string): Promise<Route[]> {
  if (USE_MOCKS) {
    await wait(300);
    if (!prefs) return [...mockRoutes];
    return mockRoutes.filter(
      (r) =>
        r.cyclistType === prefs.cyclistType &&
        r.distance <= prefs.distance * 1.5 &&
        r.airQuality >= prefs.airQuality - 20,
    );
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
    return mockRoutes.find((r) => r.id === id) ?? null;
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
    return [...mockRoutes]
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
