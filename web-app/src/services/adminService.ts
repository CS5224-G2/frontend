// =============================================================================
// ADMIN SERVICE — Web App (Vite/React)
// Adapter for the Admin Dashboard data requirements.
// Gated by VITE_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { AdminStats, AdminUser, RoutingQualityMetrics, RouteEntry } from '@shared/types/index';
import { getStoredAdminStats, getStoredAdminUsers, getStoredRoutingQualityMetrics } from './localDb';
import { apiFetch } from '../utils/apiFetch';

export type { AdminStats, AdminUser, RoutingQualityMetrics, RouteEntry };

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cyclelink.example.com';
const shouldUseMocks = () => import.meta.env.VITE_USE_MOCKS === 'true';

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendAdminStats = {
  total_rides: number;
  active_users: number;
  revenue_formatted: string;
  open_reports: number;
};

type BackendAdminUser = {
  user_id: string;
  email_address: string;
  role: 'user' | 'admin' | 'business';
  account_status: 'Active' | 'Inactive';
  joined_formatted: string;
};

type BackendRouteEntry = {
  route_id: string;
  name: string;
  rating: number;
  review_count: number;
};

type BackendRoutingQualityMetrics = {
  total_reviews: number;
  overall_avg_rating: number | null;
  total_rides_logged: number;
  top_rated_routes: BackendRouteEntry[];
  most_reviewed_routes: BackendRouteEntry[];
  total_generated_routes: number;
  avg_route_computation_ms: number | null;
  min_route_computation_ms: number | null;
  max_route_computation_ms: number | null;
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toFrontendStats = (s: BackendAdminStats): AdminStats => ({
  totalRides: s.total_rides,
  activeUsers: s.active_users,
  revenueFormatted: s.revenue_formatted,
  openReports: s.open_reports,
});

const toFrontendUser = (u: BackendAdminUser): AdminUser => ({
  id: u.user_id,
  email: u.email_address,
  role: u.role,
  status: u.account_status,
  joinedFormatted: u.joined_formatted,
});

const toFrontendRouteEntry = (r: BackendRouteEntry): RouteEntry => ({
  routeId: r.route_id,
  name: r.name,
  rating: r.rating,
  reviewCount: r.review_count,
});

const toFrontendRoutingQualityMetrics = (m: BackendRoutingQualityMetrics): RoutingQualityMetrics => ({
  totalReviews: m.total_reviews,
  overallAvgRating: m.overall_avg_rating,
  totalRidesLogged: m.total_rides_logged,
  topRatedRoutes: m.top_rated_routes.map(toFrontendRouteEntry),
  mostReviewedRoutes: m.most_reviewed_routes.map(toFrontendRouteEntry),
  totalGeneratedRoutes: m.total_generated_routes,
  avgRouteComputationMs: m.avg_route_computation_ms,
  minRouteComputationMs: m.min_route_computation_ms,
  maxRouteComputationMs: m.max_route_computation_ms,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch platform-wide statistics for the Admin Overview panel. */
export async function getAdminStats(token?: string): Promise<AdminStats> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 300));
    return getStoredAdminStats()
  }

  const response = await apiFetch(`${BASE_URL}/admin/stats`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch admin stats.');
  return toFrontendStats(await response.json() as BackendAdminStats);
}

/** Fetch routing quality metrics for the Routes panel. */
export async function getRoutingQualityMetrics(token?: string): Promise<RoutingQualityMetrics> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 300));
    return getStoredRoutingQualityMetrics();
  }

  const response = await apiFetch(`${BASE_URL}/admin/routing-quality-metrics`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch routing quality metrics.');
  return toFrontendRoutingQualityMetrics(await response.json() as BackendRoutingQualityMetrics);
}

/** Fetch the list of all registered users for the User Management table. */
export async function getAdminUsers(token?: string): Promise<AdminUser[]> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 350));
    return getStoredAdminUsers()
  }

  const response = await apiFetch(`${BASE_URL}/admin/users`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch admin users.');
  const data = await response.json() as BackendAdminUser[];
  return data.map(toFrontendUser);
}
