// =============================================================================
// ROUTE SERVICE — Mobile (Expo/React Native)
// Centralises all Route data access. UI components MUST use this service —
// they must NOT import mock data or call fetch directly.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type {
  Route,
  RouteRecommendationRequest,
  RouteRequestLocation,
  UserPreferences,
} from '../../../shared/types/index';
import { normalizeUserPreferences } from '../app/utils/routePreferences';
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
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  description: string;
};

type BackendRoute = {
  route_id: string;
  route_name?: string;
  name?: string;
  description: string;
  distance_km?: number;
  distance?: number;
  elevation_m?: number;
  elevation?: number | 'higher' | 'lower' | 'dont-care';
  estimated_time_min?: number;
  estimated_time?: number;
  rating: number;
  review_count: number;
  start_point: { lat: number; lng: number; name: string };
  end_point: { lat: number; lng: number; name: string };
  checkpoints: BackendCheckpoint[];
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  shade_pct?: number;
  shade?: number | 'reduce-shade' | 'dont-care';
  air_quality_index?: number;
  air_quality?: number | 'care' | 'dont-care';
  points_of_interest_visited?: Array<{ name: string; description?: string; lat?: number; lng?: number }>;
};

type BackendRequestLocationSource = 'search' | 'map' | 'current-location';

type BackendCheckpointRequestLocationSource = 'search' | 'map';

type BackendRequestLocation = {
  name: string;
  lat: number;
  lng: number;
  source: BackendRequestLocationSource;
};

type BackendRecommendationPayload = {
  start_point?: BackendRequestLocation;
  end_point?: BackendRequestLocation;
  checkpoints: Array<
    BackendRequestLocation & {
      id: string;
      source: BackendCheckpointRequestLocationSource;
      description: string;
    }
  >;
  preferences: {
    cyclist_type: UserPreferences['cyclistType'];
    shade_preference: UserPreferences['shadePreference'];
    elevation_preference: UserPreferences['elevationPreference'];
    air_quality_preference: UserPreferences['airQualityPreference'];
    max_distance: number;
    points_of_interest: {
      allow_hawker_center: boolean;
      allow_park: boolean;
      allow_historic_site: boolean;
      allow_tourist_attraction: boolean;
    };
  };
  limit: number;
};

type BackendRecommendationRoute = {
  route_id: string;
  name: string;
  description: string;
  distance: number;
  estimated_time: number;
  elevation: number | 'higher' | 'lower' | 'dont-care';
  shade: number | 'reduce-shade' | 'dont-care';
  air_quality: number | 'care' | 'dont-care';
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  review_count?: number;
  star?: number;
  rating: number;
  points_of_interest_visited?: Array<{ name: string }>;
  points_of_interest?: Array<{ name: string } | string>;
  visited_points_of_interest?: Array<{ name: string }>;
  start_point?: { lat: number; lng: number; name: string };
  end_point?: { lat: number; lng: number; name: string };
  checkpoints?: BackendCheckpoint[];
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
  name: r.name ?? r.route_name ?? 'Unnamed route',
  description: r.description,
  distance: r.distance ?? r.distance_km ?? 0,
  elevation: r.elevation ?? r.elevation_m ?? 'dont-care',
  estimatedTime: r.estimated_time ?? r.estimated_time_min ?? 0,
  rating: r.rating,
  reviewCount: r.review_count,
  startPoint: r.start_point,
  endPoint: r.end_point,
  checkpoints: r.checkpoints.map((cp) => ({
    id: cp.checkpoint_id,
    name: cp.checkpoint_name,
    lat: cp.lat ?? cp.latitude ?? 0,
    lng: cp.lng ?? cp.longitude ?? 0,
    description: cp.description,
  })),
  cyclistType: r.cyclist_type,
  shade: r.shade ?? r.shade_pct ?? 'dont-care',
  airQuality: r.air_quality ?? r.air_quality_index ?? 'dont-care',
  pointsOfInterestVisited: r.points_of_interest_visited,
});

function mapLocationSourceForBackend(source: RouteRequestLocation['source']): BackendRequestLocationSource {
  return source;
}

function mapCheckpointSourceForBackend(
  source: RouteRequestLocation['source'],
): BackendCheckpointRequestLocationSource {
  // Contract only allows checkpoint sources 'search' and 'map'.
  return source === 'map' ? 'map' : 'search';
}

function toBackendRequestLocation(location: RouteRequestLocation): BackendRequestLocation {
  return {
    name: location.name,
    lat: location.lat,
    lng: location.lng,
    source: mapLocationSourceForBackend(location.source),
  };
}

function buildCheckpointDescriptionForPayload(
  checkpoint: RouteRecommendationRequest['checkpoints'][number],
): string {
  const trimmedDescription = checkpoint.description?.trim();
  if (trimmedDescription) {
    return trimmedDescription;
  }

  if (checkpoint.source === 'map') {
    return `Pinned on map at ${checkpoint.lat.toFixed(5)}, ${checkpoint.lng.toFixed(5)}`;
  }

  if (checkpoint.source === 'search') {
    return `Selected from search: ${checkpoint.name}`;
  }

  return `Selected checkpoint: ${checkpoint.name}`;
}

function buildRecommendationPayload(
  routeRequest: RouteRecommendationRequest | null,
  prefs: UserPreferences,
  limit: number,
): BackendRecommendationPayload {
  return {
    start_point: routeRequest ? toBackendRequestLocation(routeRequest.startPoint) : undefined,
    end_point: routeRequest ? toBackendRequestLocation(routeRequest.endPoint) : undefined,
    checkpoints: routeRequest
      ? routeRequest.checkpoints.map((checkpoint) => ({
          id: checkpoint.id,
          ...toBackendRequestLocation(checkpoint),
          source: mapCheckpointSourceForBackend(checkpoint.source),
          description: buildCheckpointDescriptionForPayload(checkpoint),
        }))
      : [],
    preferences: {
      cyclist_type: prefs.cyclistType,
      shade_preference: prefs.shadePreference,
      elevation_preference: prefs.elevationPreference,
      air_quality_preference: prefs.airQualityPreference,
      max_distance: prefs.maxDistanceKm,
      points_of_interest: {
        allow_hawker_center: prefs.pointsOfInterest.hawkerCenter,
        allow_park: prefs.pointsOfInterest.park,
        allow_historic_site: prefs.pointsOfInterest.historicSite,
        allow_tourist_attraction: prefs.pointsOfInterest.touristAttraction,
      },
    },
    limit,
  };
}

function normalizeVisitedPoiNames(
  points:
    | Array<{ name: string }>
    | Array<{ name: string } | string>
    | undefined,
): Array<{ name: string }> | undefined {
  if (!points || points.length === 0) {
    return undefined;
  }

  const normalized = points
    .map((point) => (typeof point === 'string' ? { name: point } : point))
    .filter((point) => typeof point.name === 'string' && point.name.trim().length > 0)
    .map((point) => ({ name: point.name.trim() }));

  return normalized.length > 0 ? normalized : undefined;
}

/** Convert numeric elevation (meters) to preference string or return existing string. */
function normalizeElevation(elevation: number | 'higher' | 'lower' | 'dont-care'): 'higher' | 'lower' | 'dont-care' {
  if (typeof elevation === 'string') {
    return elevation;
  }
  // meters: 0-100 → lower, 100-200 → dont-care, 200+ → higher
  if (elevation < 100) return 'lower';
  if (elevation > 200) return 'higher';
  return 'dont-care';
}

/** Convert numeric shade percentage to preference string or return existing string. */
function normalizeShade(shade: number | 'reduce-shade' | 'dont-care'): 'reduce-shade' | 'dont-care' {
  if (typeof shade === 'string') {
    return shade;
  }
  // shade: 0-50 → dont-care, 50+ → reduce-shade
  return shade >= 50 ? 'reduce-shade' : 'dont-care';
}

/** Convert numeric air quality index to preference string or return existing string. */
function normalizeAirQuality(airQuality: number | 'care' | 'dont-care'): 'care' | 'dont-care' {
  if (typeof airQuality === 'string') {
    return airQuality;
  }
  // air_quality: 0-50 → care, 50+ → dont-care
  return airQuality >= 50 ? 'dont-care' : 'care';
}

function toFrontendRecommendedRoute(
  route: BackendRecommendationRoute,
  routeRequest: RouteRecommendationRequest | null,
): Route {
  const pointsOfInterestVisited =
    normalizeVisitedPoiNames(route.points_of_interest_visited) ??
    normalizeVisitedPoiNames(route.visited_points_of_interest) ??
    normalizeVisitedPoiNames(route.points_of_interest);

  // Handle reviewCount from either 'review_count' or 'star' field
  const reviewCount = route.review_count ?? route.star ?? 0;

  return {
    id: route.route_id,
    name: route.name,
    description: route.description,
    distance: route.distance,
    elevation: normalizeElevation(route.elevation),
    estimatedTime: route.estimated_time,
    rating: route.rating,
    reviewCount,
    startPoint:
      route.start_point ??
      routeRequest?.startPoint ?? {
        lat: 0,
        lng: 0,
        name: 'Unknown start',
      },
    endPoint:
      route.end_point ??
      routeRequest?.endPoint ?? {
        lat: 0,
        lng: 0,
        name: 'Unknown end',
      },
    checkpoints:
      route.checkpoints?.map((cp) => ({
        id: cp.checkpoint_id,
        name: cp.checkpoint_name,
        lat: cp.lat ?? cp.latitude ?? 0,
        lng: cp.lng ?? cp.longitude ?? 0,
        description: cp.description,
      })) ??
      routeRequest?.checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        name: checkpoint.name,
        lat: checkpoint.lat,
        lng: checkpoint.lng,
        description: 'User selected checkpoint',
      })) ??
      [],
    cyclistType: route.cyclist_type,
    shade: normalizeShade(route.shade),
    airQuality: normalizeAirQuality(route.air_quality),
    pointsOfInterestVisited,
  };
}

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

type RecommendationInput = UserPreferences | RouteRecommendationRequest;

function isRouteRecommendationRequest(
  input: RecommendationInput,
): input is RouteRecommendationRequest {
  return 'startPoint' in input && 'endPoint' in input && 'preferences' in input;
}

function getNormalizedPreferences(input: UserPreferences): UserPreferences {
  return normalizeUserPreferences(input);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch all available routes, optionally filtered by preferences. */
export async function getRoutes(prefs?: UserPreferences, token?: string, limit?: number): Promise<Route[]> {
  const normalizedPrefs = prefs ? getNormalizedPreferences(prefs) : undefined;

  if (USE_MOCKS) {
    await wait(300);
    const db = await getLocalDb();
    const rows = normalizedPrefs
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
          normalizedPrefs.cyclistType,
          normalizedPrefs.maxDistanceKm,
          normalizedPrefs.airQuality,
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

  const params = new URLSearchParams();
  if (normalizedPrefs) {
    params.set('cyclist_type', normalizedPrefs.cyclistType);
  }
  if (typeof limit === 'number') {
    params.set('limit', String(Math.min(Math.max(limit, 1), 3)));
  }

  const qs = params.toString();
  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendRoute[]>(`/routes${qs ? `?${qs}` : ''}`, token);
  return response.map(toFrontendRoute);
}

/** Fetch popular routes for homepage discovery sections. */
export async function getPopularRoutes(limit = 3, token?: string): Promise<Route[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 3);

  if (USE_MOCKS) {
    await wait(250);
    const db = await getLocalDb();
    const rows = await db.getAllAsync<LocalRouteRow>(
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
      ORDER BY review_count DESC, rating DESC`,
    );

    return Promise.all(rows.slice(0, normalizedLimit).map(buildRoute));
  }

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendRoute[]>(`/routes/popular?limit=${normalizedLimit}`, token);
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
  input: RecommendationInput,
  limit = 3,
  token?: string,
): Promise<Route[]> {
  const routeRequest = isRouteRecommendationRequest(input) ? input : null;
  const prefs = getNormalizedPreferences(routeRequest ? routeRequest.preferences : input);

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
  const payload = buildRecommendationPayload(routeRequest, prefs, limit);
  const response = await httpClient.post<BackendRecommendationRoute[]>(
    '/routes/recommendations',
    payload,
    token,
  );
  return response.map((route) => toFrontendRecommendedRoute(route, routeRequest));
}

/** Internal match-score helper (mirrors HomePage logic, centralised here). */
function _calculateMatchScore(route: Route, prefs: UserPreferences): number {
  let score = route.rating * 10 + Math.min(route.reviewCount / 100, 10);

  if (route.cyclistType === prefs.cyclistType) {
    score += 20;
  }

  if (route.distance <= prefs.maxDistanceKm) {
    score += 10;
  } else {
    score += Math.max(10 - (route.distance - prefs.maxDistanceKm) * 2, 0);
  }

  // Handle both numeric and string elevation values
  if (typeof route.elevation === 'number') {
    if (prefs.elevationPreference === 'lower') {
      score += Math.max(10 - route.elevation / 30, 0);
    }

    if (prefs.elevationPreference === 'higher') {
      score += Math.min(route.elevation / 30, 10);
    }
  }

  // Handle both numeric and string shade values
  if (typeof route.shade === 'number') {
    if (prefs.shadePreference === 'reduce-shade') {
      score += Math.max(route.shade / 10, 0);
    }
  }

  // Handle both numeric and string air quality values
  if (typeof route.airQuality === 'number') {
    if (prefs.airQualityPreference === 'care') {
      score += Math.max(10 - Math.abs(route.airQuality - prefs.airQuality) / 10, 0);
    }
  }

  return score;
}
