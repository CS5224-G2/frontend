// =============================================================================
// ADMIN SERVICE — Web App (Vite/React)
// Adapter for the Admin Dashboard data requirements.
// Gated by VITE_USE_MOCKS — set to 'true' to skip real network calls.
// =============================================================================

import type { AdminStats, AdminUser } from '@shared/types/index';
import { getStoredAdminStats, getStoredAdminUsers } from './localDb';
import { apiFetch } from '../utils/apiFetch';

export type { AdminStats, AdminUser };

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
