/**
 * API client for CycleLink backend (ALB).
 * Replace with real base URL and auth (e.g. Cognito JWT) when backend is ready.
 */

const getBaseUrl = (): string => {
  // Use env in production; fallback for dev
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.cyclelink.example.com';
};

export type RouteRecommendationRequest = {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  preferences?: { shade?: number; weather?: number; difficulty?: number; cultural?: number };
  waypoints?: Array<{ lat: number; lng: number } | string>;
};

export type RouteRecommendationResponse = {
  routeId: string;
  waypoints: Array<{ lat: number; lng: number; name?: string }>;
  score?: number;
  // Extend with backend contract
};

/**
 * Fetch recommended route from backend. Implement when backend exposes endpoint.
 */
export async function getRouteRecommendation(
  _params: RouteRecommendationRequest
): Promise<RouteRecommendationResponse> {
  const base = getBaseUrl();
  // TODO: POST /routes/recommend or similar
  throw new Error(`Not implemented: call ${base} with route recommendation params`);
}

/**
 * Submit post-ride rating. Implement when backend exposes endpoint.
 */
export async function submitRating(
  _routeId: string,
  _rating: { comfort?: number; scenery?: number; crowding?: number; comment?: string }
): Promise<void> {
  const base = getBaseUrl();
  // TODO: POST /trips/:id/rating or /routes/:id/rating
  throw new Error(`Not implemented: call ${base} to submit rating`);
}
