// =============================================================================
// BUSINESS SERVICE — Web App (Vite/React)
// Adapter for the Business Dashboard data requirements.
// Gated by VITE_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { BusinessLandingStats, BusinessStats, SponsoredLocation } from '@shared/types/index';
import {
  getStoredBusinessLandingStats,
  getStoredBusinessStats,
  getStoredSponsoredLocations,
} from './localDb';

export type { BusinessLandingStats, BusinessStats, SponsoredLocation };

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cyclelink.example.com';
const shouldUseMocks = () => import.meta.env.VITE_USE_MOCKS === 'true';

// ---------------------------------------------------------------------------
// Backend shapes (internal)
// ---------------------------------------------------------------------------

type BackendBusinessStats = {
  active_sponsors: number;
  data_points_formatted: string;
  total_spent_formatted: string;
  user_reach_formatted: string;
};

type BackendBusinessLandingStats = {
  monthly_users: number;
  monthly_route_requests: number;
  active_partners: number;
};

type BackendSponsoredLocation = {
  location_id: string;
  venue_name: string;
  district: string;
  view_count: string;
  click_count: string;
  campaign_status: 'Live' | 'Pending';
};

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toFrontendStats = (s: BackendBusinessStats): BusinessStats => ({
  activeSponsors: s.active_sponsors,
  dataPoints: s.data_points_formatted,
  totalSpentFormatted: s.total_spent_formatted,
  userReach: s.user_reach_formatted,
});

const toFrontendLandingStats = (s: BackendBusinessLandingStats): BusinessLandingStats => ({
  monthlyUsers: s.monthly_users,
  monthlyRouteRequests: s.monthly_route_requests,
  activePartners: s.active_partners,
});

const toFrontendLocation = (l: BackendSponsoredLocation): SponsoredLocation => ({
  id: l.location_id,
  venue: l.venue_name,
  location: l.district,
  views: l.view_count,
  clicks: l.click_count,
  status: l.campaign_status,
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetch public-facing platform statistics for the business landing page. */
export async function getBusinessLandingStats(): Promise<BusinessLandingStats> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 250));
    return getStoredBusinessLandingStats()
  }

  const response = await fetch(`${BASE_URL}/business/landing-stats`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) throw new Error('Failed to fetch business landing stats.');
  return toFrontendLandingStats(await response.json() as BackendBusinessLandingStats);
}

/** Fetch business-level statistics for the Business Overview panel. */
export async function getBusinessStats(token?: string): Promise<BusinessStats> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 300));
    return getStoredBusinessStats()
  }

  const response = await fetch(`${BASE_URL}/business/stats`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch business stats.');
  return toFrontendStats(await response.json() as BackendBusinessStats);
}

/** Fetch the list of sponsored checkpoint locations for the Sponsored Locations table. */
export async function getSponsoredLocations(token?: string): Promise<SponsoredLocation[]> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 350));
    return getStoredSponsoredLocations()
  }

  const response = await fetch(`${BASE_URL}/business/locations`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) throw new Error('Failed to fetch sponsored locations.');
  const data = await response.json() as BackendSponsoredLocation[];
  return data.map(toFrontendLocation);
}
