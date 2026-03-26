// =============================================================================
// RIDE SERVICE — Mobile (Expo/React Native)
// Centralises all Ride History data access. UI components MUST use this
// service — they must NOT import mock data or call fetch directly.
// Gated by EXPO_PUBLIC_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { RideHistory, GraphDataPoint, GraphPeriod, RouteFeedbackPayload } from '../../../shared/types/index';
import { USE_MOCKS } from '../config/runtime';
import { getActiveMockAccountId, getLocalDb } from './localDb';

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
  total_time_min: number;
  distance_km: number;
  avg_speed_kmh: number;
  checkpoints_visited: number;
  user_rating?: number;
  user_review?: string;
};

type BackendDistanceStat = {
  period_id: string;
  label: string;
  distance_km: number;
};

type BackendFeedbackPayload = {
  route_id: string;
  rating: number;
  review_text: string;
};

type LocalDistanceStatRow = {
  id: string;
  label: string;
  distance_km: number;
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
  totalTime: r.total_time_min,
  distance: r.distance_km,
  avgSpeed: r.avg_speed_kmh,
  checkpoints: r.checkpoints_visited,
  userRating: r.user_rating,
  userReview: r.user_review,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch the authenticated user's ride history. */
export async function getRideHistory(token?: string): Promise<RideHistory[]> {
  if (USE_MOCKS) {
    await wait(350);
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
        total_time_min,
        distance_km,
        avg_speed_kmh,
        checkpoints_visited,
        user_rating,
        user_review
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
        total_time_min,
        distance_km,
        avg_speed_kmh,
        checkpoints_visited,
        user_rating,
        user_review
      FROM ride_history
      WHERE account_id = ? AND id = ?`,
      accountId,
      id,
    );

    return response ? toFrontendRide(response) : null;
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
    const db = await getLocalDb();
    const accountId = await getActiveMockAccountId();
    const response = await db.getAllAsync<LocalDistanceStatRow>(
      `SELECT
        id,
        label,
        distance_km
      FROM distance_stats
      WHERE account_id = ? AND period = ?
      ORDER BY sort_order ASC`,
      accountId,
      period,
    );

    return response.map((item) =>
      period === 'week'
        ? ({ id: item.id, day: item.label, distance: item.distance_km } as GraphDataPoint)
        : ({ id: item.id, week: item.label, distance: item.distance_km } as GraphDataPoint),
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
      ? ({ id: item.period_id, day: item.label, distance: item.distance_km } as GraphDataPoint)
      : ({ id: item.period_id, week: item.label, distance: item.distance_km } as GraphDataPoint),
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
