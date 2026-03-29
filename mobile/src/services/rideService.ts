// =============================================================================
// RIDE SERVICE — Mobile (Expo/React Native)
// Centralises all Ride History data access. UI components MUST use this
// service — they must NOT import mock data or call fetch directly.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { RideHistory, GraphDataPoint, GraphPeriod, Route, RouteFeedbackPayload } from '../../../shared/types/index';
import { mockRideHistoryById } from '../../../shared/mocks/index';
import { USE_MOCKS } from '../config/runtime';
import { getActiveMockAccountId, getLocalDb, synchronizeLocalDbFromMocks } from './localDb';

export type { RideHistory, GraphDataPoint, GraphPeriod };

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    points_of_interest_visited?: Array<{
      name: string;
      description: string;
      lat: number;
      lng: number;
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

type LocalDistanceStatRow = {
  period_id: string;
  label: string;
  distance: number;
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

type LocalPointOfInterestRow = {
  id: string;
  route_id: string;
  sort_order: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

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
  })),
  routeDetails: r.route_details
    ? {
        id: r.route_details.route_id,
        name: r.route_details.name,
        description: r.route_details.description,
        distance: r.route_details.distance,
        elevation: r.route_details.elevation,
        estimatedTime: r.route_details.estimated_time,
        rating: r.route_details.rating,
        reviewCount: r.route_details.review_count,
        startPoint: { lat: 0, lng: 0, name: 'Start' },
        endPoint: { lat: 0, lng: 0, name: 'End' },
        checkpoints: r.route_details.checkpoints.map((cp) => ({
          id: cp.checkpoint_id,
          name: cp.checkpoint_name,
          lat: cp.lat,
          lng: cp.lng,
          description: cp.description,
        })),
        cyclistType: r.route_details.cyclist_type,
        shade: r.route_details.shade,
        airQuality: r.route_details.air_quality,
        pointsOfInterestVisited: r.route_details.points_of_interest_visited?.map((poi) => ({
          name: poi.name,
          description: poi.description,
        })),
      }
    : undefined,
});

const toFrontendRouteFromLocal = (
  route: LocalRouteRow,
  checkpoints: LocalCheckpointRow[],
  pointsOfInterest: LocalPointOfInterestRow[],
): Route => ({
  id: route.id,
  name: route.name,
  description: route.description,
  distance: route.distance_km,
  elevation: route.elevation_m,
  estimatedTime: route.estimated_time_min,
  rating: route.rating,
  reviewCount: route.review_count,
  startPoint: { lat: route.start_lat, lng: route.start_lng, name: route.start_name },
  endPoint: { lat: route.end_lat, lng: route.end_lng, name: route.end_name },
  checkpoints: checkpoints.map((cp) => ({
    id: cp.id,
    name: cp.name,
    lat: cp.lat,
    lng: cp.lng,
    description: cp.description,
  })),
  cyclistType: route.cyclist_type,
  shade: route.shade_pct,
  airQuality: route.air_quality_index,
  pointsOfInterestVisited: pointsOfInterest.map((poi) => ({
    name: poi.name,
    description: poi.description,
  })),
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's ride history. */
export async function getRideHistory(token?: string): Promise<RideHistory[]> {
  if (USE_MOCKS) {
    await wait(350);
    await synchronizeLocalDbFromMocks();
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const response = await db.getAllAsync<BackendRide>(
      `SELECT
        id AS ride_id,
        route_id,
        route_name,
        completion_date,
        completion_time,
        start_time,
        end_time,
        total_time_min AS total_time,
        distance_km AS distance,
        avg_speed_kmh AS avg_speed,
        checkpoints_visited,
        user_rating AS rating,
        user_review AS review
      FROM ride_history
      WHERE account_id = ?
      ORDER BY id DESC`,
      accountId,
    );

    return response.map(toFrontendRide);
  }

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendRide[]>('/rides/history', token);
  return response.map(toFrontendRide);
}

/** Fetch a single ride by ID. */
export async function getRideById(id: string, token?: string): Promise<RideHistory | null> {
  if (USE_MOCKS) {
    await wait(200);

    const mockRide = mockRideHistoryById[id];
    if (mockRide) {
      return mockRide;
    }

    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const response = await db.getFirstAsync<BackendRide>(
      `SELECT
        id AS ride_id,
        route_id,
        route_name,
        completion_date,
        completion_time,
        start_time,
        end_time,
        total_time_min AS total_time,
        distance_km AS distance,
        avg_speed_kmh AS avg_speed,
        checkpoints_visited,
        user_rating AS rating,
        user_review AS review
      FROM ride_history
      WHERE account_id = ? AND id = ?`,
      accountId,
      id,
    );

    if (!response) {
      return null;
    }

    const routeRow = await db.getFirstAsync<LocalRouteRow>(
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
      response.route_id,
    );

    if (!routeRow) {
      return toFrontendRide(response);
    }

    const checkpointRows = await db.getAllAsync<LocalCheckpointRow>(
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
      response.route_id,
    );

    const poiRows = await db.getAllAsync<LocalPointOfInterestRow>(
      `SELECT
        id,
        route_id,
        sort_order,
        name,
        description,
        lat,
        lng
      FROM route_points_of_interest
      WHERE route_id = ?
      ORDER BY sort_order ASC`,
      response.route_id,
    );

    return {
      ...toFrontendRide(response),
      visitedCheckpoints: checkpointRows.map((cp) => ({
        id: cp.id,
        name: cp.name,
        lat: cp.lat,
        lng: cp.lng,
        description: cp.description,
      })),
      pointsOfInterestVisited: poiRows.map((poi) => ({
        name: poi.name,
        description: poi.description,
        lat: poi.lat,
        lng: poi.lng,
      })),
      routeDetails: toFrontendRouteFromLocal(routeRow, checkpointRows, poiRows),
    };
  }

  try {
    const { httpClient } = await import('./httpClient');
    const response = await httpClient.get<BackendRide>(`/rides/${id}`, token);
    return toFrontendRide(response);
  } catch {
    return null;
  }
}

/**
 * Fetch distance statistics for chart display.
 * Returns weekly or monthly data points.
 */
export async function getDistanceStats(
  period: GraphPeriod,
  token?: string,
): Promise<GraphDataPoint[]> {
  if (USE_MOCKS) {
    await wait(250);
    await synchronizeLocalDbFromMocks();
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const response = await db.getAllAsync<LocalDistanceStatRow>(
      `SELECT
        id AS period_id,
        label,
        distance_km AS distance
      FROM distance_stats
      WHERE account_id = ? AND period = ?
      ORDER BY sort_order ASC`,
      accountId,
      period,
    );

    return response.map((item) =>
      period === 'week'
        ? ({ id: item.period_id, day: item.label, distance: item.distance } as GraphDataPoint)
        : ({ id: item.period_id, week: item.label, distance: item.distance } as GraphDataPoint),
    );
  }

  const { httpClient } = await import('./httpClient');
  const response = await httpClient.get<BackendDistanceStat[]>(
    `/rides/stats/distance?period=${period}`,
    token,
  );

  // Map to the appropriate GraphDataPoint union type
  return response.map((item) =>
    period === 'week'
      ? ({ id: item.period_id, day: item.label, distance: item.distance } as GraphDataPoint)
      : ({ id: item.period_id, week: item.label, distance: item.distance } as GraphDataPoint),
  );
}

/** Submit post-ride feedback (rating + optional review). */
export async function submitRideFeedback(
  payload: RouteFeedbackPayload,
  token?: string,
): Promise<void> {
  if (USE_MOCKS) {
    await wait(500);
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    await db.runAsync(
      `INSERT INTO ride_feedback (
        account_id,
        route_id,
        rating,
        review_text,
        created_at
      ) VALUES (?, ?, ?, ?, ?)`,
      accountId,
      payload.routeId,
      payload.rating,
      payload.review,
      new Date().toISOString(),
    );
    return;
  }

  const { httpClient } = await import('./httpClient');
  const backendPayload: BackendFeedbackPayload = {
    route_id: payload.routeId,
    rating: payload.rating,
    review_text: payload.review,
  };
  await httpClient.post<void>('/rides/feedback', backendPayload, token);
}
