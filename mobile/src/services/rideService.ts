// =============================================================================
// RIDE SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { RideHistory, GraphDataPoint, GraphPeriod, Route, RouteFeedbackPayload } from '../../../shared/types/index';
import { USE_MOCKS } from '../config/runtime';
import { ApiError, httpClient } from './httpClient';
import { finalizeRouteEndpoints, getRouteById } from './routeService';
import { inferPoiCategory, toPoiCategory } from '../app/utils/poiLabels';
import {
  getDistanceStatsLocal,
  getPendingLocalDistanceStats,
  getRideByIdLocal,
  getRideHistoryLocal,
  saveRideFeedbackLocal,
  saveRideLocal,
} from './localDb';

export type { RideHistory, GraphDataPoint, GraphPeriod };

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendRide = {
  ride_id: string;
  route_id: string;
  route_name: string;
  completion_date: string;
  completion_time: string;
  start_time?: string;
  end_time?: string;
  total_time: number;
  distance: number;
  avg_speed: number;
  checkpoints_visited: number;
  rating?: number;
  review?: string;
  checkpoints?: Array<{
    checkpoint_id: string;
    checkpoint_name: string;
    description: string;
    lat: number;
    lng: number;
  }>;
  points_of_interest_visited?: Array<{
    name: string;
    description: string;
    lat: number;
    lng: number;
    category?: string;
  }>;
  route_details?: {
    route_id: string;
    name: string;
    description: string;
    distance: number;
    estimated_time: number;
    elevation: number | 'lower' | 'dont-care' | 'higher';
    shade: number | 'reduce-shade' | 'dont-care';
    air_quality: number | 'care' | 'dont-care';
    cyclist_type: 'recreational' | 'commuter' | 'fitness' | 'general';
    review_count: number;
    rating: number;
    checkpoints: Array<{
      checkpoint_id: string;
      checkpoint_name: string;
      description: string;
      lat: number;
      lng: number;
    }>;
    start_point?: {
      lat?: number;
      lng?: number;
      name?: string;
    };
    end_point?: {
      lat?: number;
      lng?: number;
      name?: string;
    };
    route_path?: Array<{
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
    }>;
    points_of_interest_visited?: Array<{
      name: string;
      description: string;
      lat?: number;
      lng?: number;
      category?: string;
    }>;
  };
};

type BackendDistanceStat = {
  period_id: string;
  label: string;
  distance: number;
};

type BackendFeedbackPayload = {
  route_id: string;
  rating: number;
  review_text: string;
};

export type SaveRidePayload = {
  route: Route;
  startTime: string;
  endTime: string;
  distance: number;
  avgSpeed: number;
  checkpointsVisited: number;
  pointsOfInterestVisited?: NonNullable<Route['pointsOfInterestVisited']>;
};

type BackendSaveRidePayload = {
  route_id: string;
  start_time: string;
  end_time: string;
  distance: number;
  avg_speed: number;
  checkpoints_visited: Array<{
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
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

type BackendLatLng = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

function parseBackendRoutePath(raw: BackendLatLng[] | undefined): Route['routePath'] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }

  const points = raw.flatMap((point) => {
    const lat = point.lat ?? point.latitude;
    const lng = point.lng ?? point.longitude;
    return typeof lat === 'number' && typeof lng === 'number' ? [{ lat, lng }] : [];
  });

  return points.length >= 2 ? points : undefined;
}

const toFrontendRide = (r: BackendRide): RideHistory => ({
  id: r.ride_id,
  routeId: r.route_id,
  routeName: r.route_name,
  completionDate: r.completion_date,
  completionTime: r.completion_time,
  startTime: r.start_time,
  endTime: r.end_time,
  totalTime: r.total_time,
  distance: r.distance,
  avgSpeed: r.avg_speed,
  checkpoints: r.checkpoints_visited,
  userRating: r.rating,
  userReview: r.review,
  visitedCheckpoints: r.checkpoints?.map((cp) => ({
    id: cp.checkpoint_id,
    name: cp.checkpoint_name,
    lat: cp.lat,
    lng: cp.lng,
    description: cp.description,
  })),
  pointsOfInterestVisited: r.points_of_interest_visited?.map((poi) => ({
    name: poi.name,
    description: poi.description,
    lat: poi.lat,
    lng: poi.lng,
    category: toPoiCategory(poi.category) ?? inferPoiCategory(poi.name),
  })),
  routeDetails: r.route_details
    ? finalizeRouteEndpoints({
        id: r.route_details.route_id,
        name: r.route_details.name,
        description: r.route_details.description,
        distance: r.route_details.distance,
        elevation: r.route_details.elevation,
        estimatedTime: r.route_details.estimated_time,
        rating: r.route_details.rating,
        reviewCount: r.route_details.review_count,
        startPoint: {
          lat: r.route_details.start_point?.lat ?? 0,
          lng: r.route_details.start_point?.lng ?? 0,
          name: r.route_details.start_point?.name ?? '',
        },
        endPoint: {
          lat: r.route_details.end_point?.lat ?? 0,
          lng: r.route_details.end_point?.lng ?? 0,
          name: r.route_details.end_point?.name ?? '',
        },
        checkpoints: r.route_details.checkpoints.map((cp) => ({
          id: cp.checkpoint_id,
          name: cp.checkpoint_name,
          lat: cp.lat,
          lng: cp.lng,
          description: cp.description,
        })),
        routePath: parseBackendRoutePath(r.route_details.route_path),
        cyclistType: r.route_details.cyclist_type,
        shade: r.route_details.shade,
        airQuality: r.route_details.air_quality,
        pointsOfInterestVisited: r.route_details.points_of_interest_visited?.map((poi) => ({
          name: poi.name,
          description: poi.description,
          lat: poi.lat,
          lng: poi.lng,
          category: toPoiCategory(poi.category) ?? inferPoiCategory(poi.name),
        })),
      })
    : undefined,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRideHistory(token?: string): Promise<RideHistory[]> {
  if (USE_MOCKS) {
    return getRideHistoryLocal();
  }

  const localPending = await getRideHistoryLocal({ pendingOnly: true });

  try {
    const response = await httpClient.get<BackendRide[]>('/rides/history', token);
    const remoteRides = response.map(toFrontendRide);
    const missingRouteIds = Array.from(
      new Set(
        remoteRides
          .filter((ride) => !ride.routeDetails)
          .map((ride) => ride.routeId)
          .filter((routeId): routeId is string => typeof routeId === 'string' && routeId.length > 0),
      ),
    );

    const resolvedRoutes = new Map<string, Route | null>(
      await Promise.all(
        missingRouteIds.map(async (routeId) => [routeId, await getRouteById(routeId, token)] as const),
      ),
    );

    const hydratedRemoteRides = remoteRides.map((ride) => ({
      ...ride,
      routeDetails: ride.routeDetails ?? resolvedRoutes.get(ride.routeId) ?? undefined,
    }));

    return [...localPending, ...hydratedRemoteRides];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('getRideHistory-debug-error', error);
    return localPending;
  }
}

export async function getRideById(id: string, token?: string): Promise<RideHistory | null> {
  if (id.startsWith('local-')) {
    return getRideByIdLocal(id);
  }

  if (USE_MOCKS) {
    return getRideByIdLocal(id);
  }

  try {
    const response = await httpClient.get<BackendRide>(`/rides/${id}`, token);
    return toFrontendRide(response);
  } catch {
    return getRideByIdLocal(id);
  }
}

export async function getDistanceStats(period: GraphPeriod, token?: string): Promise<GraphDataPoint[]> {
  const mergeLocalStats = (
    baseStats: GraphDataPoint[],
    localStats: GraphDataPoint[],
  ): GraphDataPoint[] =>
    baseStats.map((item) => {
      if ('day' in item) {
        const local = localStats.find((entry) => 'day' in entry && entry.day === item.day);
        return local ? { ...item, distance: item.distance + local.distance } : item;
      }

      const local = localStats.find((entry) => 'week' in entry && entry.week === item.week);
      return local ? { ...item, distance: item.distance + local.distance } : item;
    });

  const localPending = await getPendingLocalDistanceStats(period);

  if (USE_MOCKS) {
    return getDistanceStatsLocal(period);
  }

  try {
    const response = await httpClient.get<BackendDistanceStat[]>(`/rides/stats/distance?period=${period}`, token);
    const mapped = response.map((item) =>
      period === 'week'
        ? ({ id: item.period_id, day: item.label, distance: item.distance } as GraphDataPoint)
        : ({ id: item.period_id, week: item.label, distance: item.distance } as GraphDataPoint),
    );
    return mapped.length > 0 ? mergeLocalStats(mapped, localPending) : localPending;
  } catch {
    return localPending;
  }
}

export async function submitRideFeedback(payload: RouteFeedbackPayload, token?: string): Promise<void> {
  const backendPayload: BackendFeedbackPayload = {
    route_id: payload.routeId,
    rating: payload.rating,
    review_text: payload.review ?? '',
  };

  const persistLocal = () =>
    saveRideFeedbackLocal({
      routeId: payload.routeId,
      rating: payload.rating,
      reviewText: payload.review ?? '',
    });

  if (USE_MOCKS) {
    await persistLocal();
    return;
  }

  try {
    await httpClient.post<void>('/rides/feedback', backendPayload, token);
  } catch (e) {
    // Contract: 404 = route not found on server. Many stacks also return 404 if the route is not mounted.
    // Save locally so the user can still finish the journey; data can be synced when the backend matches.
    if (e instanceof ApiError && e.status === 404) {
      await persistLocal();
      return;
    }
    throw e;
  }
}

export async function saveRide(payload: SaveRidePayload, token?: string): Promise<RideHistory> {
  const backendPayload: BackendSaveRidePayload = {
    route_id: payload.route.id,
    start_time: payload.startTime,
    end_time: payload.endTime,
    distance: payload.distance,
    avg_speed: payload.avgSpeed,
    checkpoints_visited: payload.route.checkpoints.slice(0, payload.checkpointsVisited).map((checkpoint) => ({
      checkpoint_id: checkpoint.id,
      checkpoint_name: checkpoint.name,
      description: checkpoint.description,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
    })),
    points_of_interest_visited: payload.pointsOfInterestVisited,
  };
  const persistLocal = () =>
    saveRideLocal({
      route: payload.route,
      startTime: payload.startTime,
      endTime: payload.endTime,
      distance: payload.distance,
      avgSpeed: payload.avgSpeed,
      checkpointsVisited: payload.checkpointsVisited,
    });

  if (USE_MOCKS) {
    return persistLocal();
  }

  try {
    const response = await httpClient.post<BackendRide>('/rides', backendPayload, token);
    return toFrontendRide(response);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      throw e;
    }
    return persistLocal();
  }
}
