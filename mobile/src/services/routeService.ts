// =============================================================================
// ROUTE SERVICE — Mobile (Expo/React Native)
// Centralises all Route data access. UI components MUST use this service —
// they must NOT import mock data or call fetch directly.
// =============================================================================

import type {
  Route,
  RouteRecommendationRequest,
  RouteRequestLocation,
  UserPreferences,
} from '../../../shared/types/index';
import { normalizeUserPreferences } from '../app/utils/routePreferences';
import { httpClient } from './httpClient';

export type { Route };
export type SavedRoute = {
  savedRouteId: string;
  savedAt: string;
  route: Route;
};

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

type BackendLatLng = { lat?: number; lng?: number; latitude?: number; longitude?: number };

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
  start_point?: { lat?: number; lng?: number; name?: string };
  end_point?: { lat?: number; lng?: number; name?: string };
  checkpoints?: BackendCheckpoint[];
  route_path?: BackendLatLng[];
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
  start_point?: { lat?: number; lng?: number; name?: string };
  end_point?: { lat?: number; lng?: number; name?: string };
  checkpoints?: BackendCheckpoint[];
  route_path?: BackendLatLng[];
};

type BackendSavedRoute = BackendRoute & {
  saved_route_id: string;
  saved_at: string;
};

type BackendSavedRoutesResponse = {
  saved_routes?: BackendSavedRoute[];
  total?: number;
};

type BackendSaveRouteResponse = {
  saved_route_id: string;
  route_id: string;
  saved_at: string;
  status?: string;
};

type BackendSaveRoutePayload = {
  route_id: string;
  name: string;
  description: string;
  distance: number;
  estimated_time: number;
  elevation: 'higher' | 'lower' | 'dont-care';
  shade: 'reduce-shade' | 'dont-care';
  air_quality: 'care' | 'dont-care';
  cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
  checkpoints: Array<{
    checkpoint_id: string;
    checkpoint_name: string;
    description: string;
    lat: number;
    lng: number;
  }>;
  points_of_interest_visited?: Array<{
    name: string;
    description?: string;
    lat?: number;
    lng?: number;
  }>;
  route_path?: Array<{ lat: number; lng: number }>;
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function parseBackendRoutePath(raw: BackendLatLng[] | undefined): Route['routePath'] {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: Array<{ lat: number; lng: number }> = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const lat = p.lat ?? p.latitude;
    const lng = p.lng ?? p.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      out.push({ lat, lng });
    }
  }
  if (out.length >= 2) return out;
  return undefined;
}

function mapBackendCheckpoints(checkpoints: BackendCheckpoint[] | undefined): Route['checkpoints'] {
  return (checkpoints ?? []).map((cp) => ({
    id: cp.checkpoint_id,
    name: cp.checkpoint_name?.trim() ? cp.checkpoint_name : 'Checkpoint',
    lat: cp.lat ?? cp.latitude ?? 0,
    lng: cp.lng ?? cp.longitude ?? 0,
    description: cp.description ?? '',
  }));
}

/** Prefer contract string enums; fall back to numeric `elevation_m` when present (legacy / partial APIs). */
function parseRouteElevationFromBackend(r: BackendRoute): Route['elevation'] {
  const raw: unknown = r.elevation;
  if (raw === 'higher' || raw === 'lower' || raw === 'dont-care') return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase().replace(/_/g, '-');
    if (s === 'higher' || s === 'lower' || s === 'dont-care') return s;
  }
  const m = r.elevation_m;
  if (typeof m === 'number' && Number.isFinite(m)) return m;
  return 'dont-care';
}

/** Fill missing start/end coordinates and labels from route_path or checkpoints (API list/detail gaps). */
export function finalizeRouteEndpoints(route: Route): Route {
  const path = route.routePath ?? [];
  const cps = route.checkpoints;

  const improve = (point: Route['startPoint'], role: 'start' | 'end'): Route['startPoint'] => {
    let { lat, lng, name } = point;
    const label = role === 'start' ? 'Start' : 'End';

    if (lat === 0 && lng === 0) {
      if (path.length >= 2) {
        const node = role === 'start' ? path[0] : path[path.length - 1];
        lat = node.lat;
        lng = node.lng;
      } else if (cps.length > 0) {
        const node = role === 'start' ? cps[0] : cps[cps.length - 1];
        lat = node.lat;
        lng = node.lng;
      }
    }

    const trimmed = name?.trim() ?? '';
    const placeholderName =
      !trimmed || trimmed === 'Unknown start' || trimmed === 'Unknown end';

    let nextName = trimmed;
    if (lat !== 0 || lng !== 0) {
      if (placeholderName) {
        nextName = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
      }
    } else if (placeholderName || !nextName) {
      nextName = label;
    }

    return { lat, lng, name: nextName };
  };

  return {
    ...route,
    startPoint: improve(route.startPoint, 'start'),
    endPoint: improve(route.endPoint, 'end'),
  };
}

const toFrontendRoute = (r: BackendRoute): Route => {
  const checkpoints = mapBackendCheckpoints(r.checkpoints);
  const routePath = parseBackendRoutePath(r.route_path);

  const base: Route = {
    id: r.route_id,
    name: r.name ?? r.route_name ?? 'Unnamed route',
    description: r.description,
    distance: r.distance ?? r.distance_km ?? 0,
    elevation: parseRouteElevationFromBackend(r),
    estimatedTime: r.estimated_time ?? r.estimated_time_min ?? 0,
    rating: r.rating,
    reviewCount: r.review_count,
    startPoint: {
      lat: r.start_point?.lat ?? 0,
      lng: r.start_point?.lng ?? 0,
      name: r.start_point?.name?.trim() ?? '',
    },
    endPoint: {
      lat: r.end_point?.lat ?? 0,
      lng: r.end_point?.lng ?? 0,
      name: r.end_point?.name?.trim() ?? '',
    },
    checkpoints,
    routePath,
    cyclistType: r.cyclist_type,
    shade: r.shade ?? r.shade_pct ?? 'dont-care',
    airQuality: r.air_quality ?? r.air_quality_index ?? 'dont-care',
    pointsOfInterestVisited: r.points_of_interest_visited,
  };

  return finalizeRouteEndpoints(base);
};

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
function normalizeElevation(
  elevation: number | 'higher' | 'lower' | 'dont-care' | undefined | null,
): 'higher' | 'lower' | 'dont-care' {
  if (elevation === undefined || elevation === null) return 'dont-care';
  if (typeof elevation === 'string') {
    if (elevation === 'higher' || elevation === 'lower' || elevation === 'dont-care') return elevation;
    return 'dont-care';
  }
  if (typeof elevation === 'number' && Number.isFinite(elevation)) {
    if (elevation < 100) return 'lower';
    if (elevation > 200) return 'higher';
    return 'dont-care';
  }
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

  const checkpoints =
    route.checkpoints?.map((cp) => ({
      id: cp.checkpoint_id,
      name: cp.checkpoint_name?.trim() ? cp.checkpoint_name : 'Checkpoint',
      lat: cp.lat ?? cp.latitude ?? 0,
      lng: cp.lng ?? cp.longitude ?? 0,
      description: cp.description ?? '',
    })) ??
    routeRequest?.checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      name: checkpoint.name,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      description: 'User selected checkpoint',
    })) ??
    [];

  const routePath = parseBackendRoutePath(route.route_path);

  const startFromReq = routeRequest?.startPoint;
  const endFromReq = routeRequest?.endPoint;

  const base: Route = {
    id: route.route_id,
    name: route.name,
    description: route.description,
    distance: route.distance,
    elevation: normalizeElevation(route.elevation),
    estimatedTime: route.estimated_time,
    rating: route.rating,
    reviewCount,
    startPoint: {
      lat: route.start_point?.lat ?? startFromReq?.lat ?? 0,
      lng: route.start_point?.lng ?? startFromReq?.lng ?? 0,
      name: route.start_point?.name?.trim() || startFromReq?.name?.trim() || '',
    },
    endPoint: {
      lat: route.end_point?.lat ?? endFromReq?.lat ?? 0,
      lng: route.end_point?.lng ?? endFromReq?.lng ?? 0,
      name: route.end_point?.name?.trim() || endFromReq?.name?.trim() || '',
    },
    checkpoints,
    routePath,
    cyclistType: route.cyclist_type,
    shade: normalizeShade(route.shade),
    airQuality: normalizeAirQuality(route.air_quality),
    pointsOfInterestVisited,
  };

  return finalizeRouteEndpoints(base);
}

function toSavedRoute(route: BackendSavedRoute): SavedRoute {
  return {
    savedRouteId: route.saved_route_id,
    savedAt: route.saved_at,
    route: toFrontendRoute(route),
  };
}

function toSaveRoutePayload(route: Route): BackendSaveRoutePayload {
  return {
    route_id: route.id,
    name: route.name,
    description: route.description,
    distance: route.distance,
    estimated_time: route.estimatedTime,
    elevation: normalizeElevation(route.elevation),
    shade: normalizeShade(route.shade),
    air_quality: normalizeAirQuality(route.airQuality),
    cyclist_type: route.cyclistType,
    checkpoints: route.checkpoints.map((checkpoint) => ({
      checkpoint_id: checkpoint.id,
      checkpoint_name: checkpoint.name,
      description: checkpoint.description,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
    })),
    points_of_interest_visited: route.pointsOfInterestVisited,
    route_path: route.routePath,
  };
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

  const params = new URLSearchParams();
  if (normalizedPrefs) {
    params.set('cyclist_type', normalizedPrefs.cyclistType);
  }
  if (typeof limit === 'number') {
    params.set('limit', String(Math.min(Math.max(limit, 1), 3)));
  }

  const qs = params.toString();
  const response = await httpClient.get<BackendRoute[]>(`/routes${qs ? `?${qs}` : ''}`, token);
  return response.map(toFrontendRoute);
}

/** Fetch popular routes for homepage discovery sections. */
export async function getPopularRoutes(limit = 3, token?: string): Promise<Route[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 3);

  const response = await httpClient.get<BackendRoute[]>(`/routes/popular?limit=${normalizedLimit}`, token);
  return response.map(toFrontendRoute);
}

/** Fetch a single route by ID. */
export async function getRouteById(id: string, token?: string): Promise<Route | null> {
  try {
    const response = await httpClient.get<BackendRoute>(`/routes/${id}`, token);
    return toFrontendRoute(response);
  } catch {
    return null;
  }
}

/** Fetch all routes saved by the authenticated user. */
export async function getSavedRoutes(token?: string): Promise<SavedRoute[]> {
  const response = await httpClient.get<BackendSavedRoutesResponse>('/routes/saved', token);
  const savedRoutes = response.saved_routes ?? [];
  return savedRoutes.map(toSavedRoute);
}

/** Save a route to the authenticated user's backend favorites list. */
export async function saveRoute(tokenOrRoute: string | Route, maybeRoute?: Route): Promise<SavedRoute> {
  const token = typeof tokenOrRoute === 'string' ? tokenOrRoute : undefined;
  const route = typeof tokenOrRoute === 'string' ? maybeRoute : tokenOrRoute;

  if (!route) {
    throw new Error('Route is required to save favorites');
  }

  const payload = toSaveRoutePayload(route);
  const response = await httpClient.post<BackendSaveRouteResponse>('/routes/save', payload, token);

  return {
    savedRouteId: response.saved_route_id,
    savedAt: response.saved_at,
    route,
  };
}

/** Remove one saved route from backend favorites by saved_route_id. */
export async function deleteSavedRoute(savedRouteId: string, token?: string): Promise<void> {
  await httpClient.delete<void>(`/routes/saved/${savedRouteId}`, token);
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
  const prefs = getNormalizedPreferences(routeRequest ? routeRequest.preferences : (input as UserPreferences));
  const normalizedLimit = Math.min(Math.max(routeRequest?.limit ?? limit, 1), 3);

  const payload = buildRecommendationPayload(routeRequest, prefs, normalizedLimit);
  console.log('[routeService] POST /routes/recommendations payload:', JSON.stringify(payload, null, 2));

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
  if (typeof route.airQuality === 'number' && prefs.airQualityPreference === 'care') {
    score += Math.max(10 - route.airQuality / 10, 0);
  }

  return score;
}
