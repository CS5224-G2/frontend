// =============================================================================
// RIDE SERVICE — Mobile (Expo/React Native)
// Adapter pattern: maps between backend snake_case and frontend camelCase.
// =============================================================================

import type { RideHistory, GraphDataPoint, GraphPeriod, RouteFeedbackPayload } from '../../../shared/types/index';
import { httpClient } from './httpClient';

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
      lat?: number;
      lng?: number;
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
  routeId: string;
  completionDate: string;
  totalTime: number;
  distance: number;
  avgSpeed: number;
  checkpointsVisited: number;
};

type BackendSaveRidePayload = {
  route_id: string;
  completion_date: string;
  total_time: number;
  distance: number;
  avg_speed: number;
  checkpoints_visited: number;
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getRideHistory(token?: string): Promise<RideHistory[]> {
  const response = await httpClient.get<BackendRide[]>('/rides/history', token);
  return response.map(toFrontendRide);
}

export async function getRideById(id: string, token?: string): Promise<RideHistory | null> {
  try {
    const response = await httpClient.get<BackendRide>(`/rides/${id}`, token);
    return toFrontendRide(response);
  } catch {
    return null;
  }
}

export async function getDistanceStats(period: GraphPeriod, token?: string): Promise<GraphDataPoint[]> {
  const response = await httpClient.get<BackendDistanceStat[]>(`/rides/stats/distance?period=${period}`, token);
  return response.map((item) =>
    period === 'week'
      ? ({ id: item.period_id, day: item.label, distance: item.distance } as GraphDataPoint)
      : ({ id: item.period_id, week: item.label, distance: item.distance } as GraphDataPoint),
  );
}

export async function submitRideFeedback(payload: RouteFeedbackPayload, token?: string): Promise<void> {
  const backendPayload: BackendFeedbackPayload = {
    route_id: payload.routeId,
    rating: payload.rating,
    review_text: payload.review,
  };
  await httpClient.post<void>('/rides/feedback', backendPayload, token);
}

export async function saveRide(payload: SaveRidePayload, token?: string): Promise<RideHistory> {
  const backendPayload: BackendSaveRidePayload = {
    route_id: payload.routeId,
    completion_date: payload.completionDate,
    total_time: payload.totalTime,
    distance: payload.distance,
    avg_speed: payload.avgSpeed,
    checkpoints_visited: payload.checkpointsVisited,
  };
  const response = await httpClient.post<BackendRide>('/routes/save', backendPayload, token);
  return toFrontendRide(response);
}
