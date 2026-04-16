# Routing Quality Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the existing "Routes" tab in the Admin Dashboard with routing quality metrics fetched from `GET /admin/routing-quality-metrics`.

**Architecture:** Add `RoutingQualityMetrics` / `RouteEntry` types to the shared type layer, wire up a mock fixture and a `getStoredRoutingQualityMetrics` helper in the local mock DB, then add `getRoutingQualityMetrics` to `adminService` following the exact same pattern as the existing `getAdminStats` / `getAdminUsers` functions. Finally, extend `AdminDashboard` to fetch the new data on mount and render the Routes tab panel.

**Tech Stack:** TypeScript, React (Vite), Vitest, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `shared/types/index.ts` | Modify | Add `RouteEntry` and `RoutingQualityMetrics` canonical types |
| `shared/mocks/index.ts` | Modify | Add `mockRoutingQualityMetrics` fixture |
| `web-app/src/services/localDb.ts` | Modify | Add `routingQualityMetrics` field to `WebLocalDbState`; add `getStoredRoutingQualityMetrics()` |
| `web-app/src/services/adminService.ts` | Modify | Add `BackendRoutingQualityMetrics` shape, mapper, and `getRoutingQualityMetrics()` |
| `web-app/src/services/adminService.test.ts` | Modify | Add tests for `getRoutingQualityMetrics` |
| `web-app/src/pages/AdminDashboard.tsx` | Modify | Fetch metrics on mount; render Routes tab panel |

---

## Task 1: Add shared types

**Files:**
- Modify: `shared/types/index.ts`

- [ ] **Step 1: Add `RouteEntry` and `RoutingQualityMetrics` to the Admin Dashboard section**

Open `shared/types/index.ts`. After the `AdminUser` type (around line 221), add:

```ts
export type RouteEntry = {
  routeId: string
  name: string
  rating: number
  reviewCount: number
}

export type RoutingQualityMetrics = {
  totalReviews: number
  overallAvgRating: number | null
  totalRidesLogged: number
  topRatedRoutes: RouteEntry[]
  mostReviewedRoutes: RouteEntry[]
  totalGeneratedRoutes: number
  avgRouteComputationMs: number | null
  minRouteComputationMs: number | null
  maxRouteComputationMs: number | null
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /path/to/repo/web-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add shared/types/index.ts
git commit -m "feat: add RouteEntry and RoutingQualityMetrics shared types"
```

---

## Task 2: Add mock fixture

**Files:**
- Modify: `shared/mocks/index.ts`

- [ ] **Step 1: Import `RoutingQualityMetrics` at the top of the file**

The existing import block starts at line 7. Add `RoutingQualityMetrics` to it:

```ts
import type {
  AuthUser,
  AuthResult,
  UserProfile,
  PasswordUpdateResult,
  PrivacySecuritySettings,
  Route,
  RideHistory,
  GraphDataPoint,
  AdminStats,
  AdminUser,
  RoutingQualityMetrics,
  BusinessLandingStats,
  BusinessStats,
  SponsoredLocation,
} from '../types/index';
```

- [ ] **Step 2: Add `mockRoutingQualityMetrics` at the end of the Admin Dashboard Mocks section** (after `mockAdminUsers`, before the Business Dashboard Mocks comment block)

```ts
export const mockRoutingQualityMetrics: RoutingQualityMetrics = {
  totalReviews: 184,
  overallAvgRating: 3.87,
  totalRidesLogged: 412,
  topRatedRoutes: [
    { routeId: '6627c3f2a4e1b23d0f9e1001', name: 'East Coast Park Loop', rating: 4.8, reviewCount: 31 },
    { routeId: '6627c3f2a4e1b23d0f9e1002', name: 'Punggol Waterway Trail', rating: 4.6, reviewCount: 18 },
  ],
  mostReviewedRoutes: [
    { routeId: '6627c3f2a4e1b23d0f9e1003', name: 'Southern Ridges Connector', rating: 4.1, reviewCount: 57 },
    { routeId: '6627c3f2a4e1b23d0f9e1001', name: 'East Coast Park Loop', rating: 4.8, reviewCount: 31 },
  ],
  totalGeneratedRoutes: 89,
  avgRouteComputationMs: 2156.3,
  minRouteComputationMs: 1412.0,
  maxRouteComputationMs: 3201.7,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /path/to/repo/web-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add shared/mocks/index.ts
git commit -m "feat: add mockRoutingQualityMetrics fixture"
```

---

## Task 3: Wire mock into localDb

**Files:**
- Modify: `web-app/src/services/localDb.ts`

- [ ] **Step 1: Import `RoutingQualityMetrics` and `mockRoutingQualityMetrics`**

At the top of `localDb.ts`, the type import (line 1) and mock import (line 9) already exist. Extend both:

Type import — add `RoutingQualityMetrics`:
```ts
import type {
  AdminStats,
  AdminUser,
  AuthResult,
  AuthUser,
  BusinessLandingStats,
  BusinessStats,
  RoutingQualityMetrics,
  SponsoredLocation,
} from '@shared/types/index'
```

Mock import — add `mockRoutingQualityMetrics`:
```ts
import {
  mockAdminStats,
  mockAdminUser,
  mockAdminUsers,
  mockAuthUser,
  mockBusinessLandingStats,
  mockBusinessStats,
  mockBusinessUser,
  mockRoutingQualityMetrics,
  mockSponsoredLocations,
} from '@shared/mocks/index'
```

- [ ] **Step 2: Add `routingQualityMetrics` field to `WebLocalDbState`**

The `WebLocalDbState` type is defined around line 28. Add the new field:

```ts
type WebLocalDbState = {
  users: StoredUser[]
  adminStats: AdminStats
  adminUsers: AdminUser[]
  routingQualityMetrics: RoutingQualityMetrics
  businessStats: BusinessStats
  businessLandingStats: BusinessLandingStats
  sponsoredLocations: SponsoredLocation[]
}
```

- [ ] **Step 3: Seed `routingQualityMetrics` in `createSeedState`**

The `createSeedState` function is around line 43. Add the field:

```ts
function createSeedState(): WebLocalDbState {
  return {
    users: [
      { ...mockAuthUser, email: normalizeEmail(mockAuthUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
      { ...mockAdminUser, email: normalizeEmail(mockAdminUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
      { ...mockBusinessUser, email: normalizeEmail(mockBusinessUser.email), passwordHash: SEED_CREDENTIAL_DIGEST },
    ],
    adminStats: { ...mockAdminStats },
    adminUsers: [...mockAdminUsers],
    routingQualityMetrics: { ...mockRoutingQualityMetrics, topRatedRoutes: [...mockRoutingQualityMetrics.topRatedRoutes], mostReviewedRoutes: [...mockRoutingQualityMetrics.mostReviewedRoutes] },
    businessStats: { ...mockBusinessStats },
    businessLandingStats: { ...mockBusinessLandingStats },
    sponsoredLocations: [...mockSponsoredLocations],
  }
}
```

- [ ] **Step 4: Add `getStoredRoutingQualityMetrics` export at the end of the file**

After the existing `getStoredAdminUsers` function:

```ts
export async function getStoredRoutingQualityMetrics(): Promise<RoutingQualityMetrics> {
  const state = await getWebLocalDb()
  return {
    ...state.routingQualityMetrics,
    topRatedRoutes: [...state.routingQualityMetrics.topRatedRoutes],
    mostReviewedRoutes: [...state.routingQualityMetrics.mostReviewedRoutes],
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /path/to/repo/web-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web-app/src/services/localDb.ts
git commit -m "feat: add routingQualityMetrics to localDb mock store"
```

---

## Task 4: Add service function + tests

**Files:**
- Modify: `web-app/src/services/adminService.ts`
- Modify: `web-app/src/services/adminService.test.ts`

- [ ] **Step 1: Write the failing test first**

Open `web-app/src/services/adminService.test.ts`. Add a new `describe` block after the existing `getAdminUsers` block:

```ts
import { getAdminStats, getAdminUsers, getRoutingQualityMetrics } from './adminService'

// (add inside the existing describe('adminService (mock mode)', ...) block)

describe('getRoutingQualityMetrics()', () => {
  it('returns a RoutingQualityMetrics object with all required fields', async () => {
    const metrics = await getRoutingQualityMetrics()
    expect(metrics).toHaveProperty('totalReviews')
    expect(metrics).toHaveProperty('overallAvgRating')
    expect(metrics).toHaveProperty('totalRidesLogged')
    expect(metrics).toHaveProperty('topRatedRoutes')
    expect(metrics).toHaveProperty('mostReviewedRoutes')
    expect(metrics).toHaveProperty('totalGeneratedRoutes')
    expect(metrics).toHaveProperty('avgRouteComputationMs')
    expect(metrics).toHaveProperty('minRouteComputationMs')
    expect(metrics).toHaveProperty('maxRouteComputationMs')
  })

  it('totalReviews is a non-negative number', async () => {
    const metrics = await getRoutingQualityMetrics()
    expect(typeof metrics.totalReviews).toBe('number')
    expect(metrics.totalReviews).toBeGreaterThanOrEqual(0)
  })

  it('overallAvgRating is null or a number between 1 and 5', async () => {
    const metrics = await getRoutingQualityMetrics()
    if (metrics.overallAvgRating !== null) {
      expect(metrics.overallAvgRating).toBeGreaterThanOrEqual(1)
      expect(metrics.overallAvgRating).toBeLessThanOrEqual(5)
    }
  })

  it('topRatedRoutes is an array of RouteEntry objects', async () => {
    const metrics = await getRoutingQualityMetrics()
    expect(Array.isArray(metrics.topRatedRoutes)).toBe(true)
    metrics.topRatedRoutes.forEach((r) => {
      expect(r).toHaveProperty('routeId')
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('rating')
      expect(r).toHaveProperty('reviewCount')
    })
  })

  it('mostReviewedRoutes is an array of RouteEntry objects', async () => {
    const metrics = await getRoutingQualityMetrics()
    expect(Array.isArray(metrics.mostReviewedRoutes)).toBe(true)
    metrics.mostReviewedRoutes.forEach((r) => {
      expect(r).toHaveProperty('routeId')
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('rating')
      expect(r).toHaveProperty('reviewCount')
    })
  })

  it('avgRouteComputationMs is null or a positive number', async () => {
    const metrics = await getRoutingQualityMetrics()
    if (metrics.avgRouteComputationMs !== null) {
      expect(metrics.avgRouteComputationMs).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /path/to/repo/web-app && npx vitest run src/services/adminService.test.ts
```

Expected: FAIL — `getRoutingQualityMetrics is not a function` (or similar import error).

- [ ] **Step 3: Implement `getRoutingQualityMetrics` in `adminService.ts`**

Add the following to `web-app/src/services/adminService.ts`.

First, update the import from `localDb` to include `getStoredRoutingQualityMetrics`:
```ts
import { getStoredAdminStats, getStoredAdminUsers, getStoredRoutingQualityMetrics } from './localDb';
```

Add the import for the new shared type at the top (alongside the existing `AdminStats`/`AdminUser` import):
```ts
import type { AdminStats, AdminUser, RoutingQualityMetrics, RouteEntry } from '@shared/types/index';
export type { AdminStats, AdminUser, RoutingQualityMetrics, RouteEntry };
```

Add the backend shape (after the existing `BackendAdminUser` type):
```ts
type BackendRouteEntry = {
  route_id: string
  name: string
  rating: number
  review_count: number
}

type BackendRoutingQualityMetrics = {
  total_reviews: number
  overall_avg_rating: number | null
  total_rides_logged: number
  top_rated_routes: BackendRouteEntry[]
  most_reviewed_routes: BackendRouteEntry[]
  total_generated_routes: number
  avg_route_computation_ms: number | null
  min_route_computation_ms: number | null
  max_route_computation_ms: number | null
}
```

Add the mapper (after the existing `toFrontendUser` mapper):
```ts
const toFrontendRouteEntry = (r: BackendRouteEntry): RouteEntry => ({
  routeId: r.route_id,
  name: r.name,
  rating: r.rating,
  reviewCount: r.review_count,
})

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
})
```

Add the exported function (after `getAdminUsers`):
```ts
/** Fetch routing quality metrics for the Routes panel. */
export async function getRoutingQualityMetrics(token?: string): Promise<RoutingQualityMetrics> {
  if (shouldUseMocks()) {
    await new Promise((r) => setTimeout(r, 300))
    return getStoredRoutingQualityMetrics()
  }

  const response = await apiFetch(`${BASE_URL}/admin/routing-quality-metrics`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) throw new Error('Failed to fetch routing quality metrics.')
  return toFrontendRoutingQualityMetrics(await response.json() as BackendRoutingQualityMetrics)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /path/to/repo/web-app && npx vitest run src/services/adminService.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web-app/src/services/adminService.ts web-app/src/services/adminService.test.ts
git commit -m "feat: add getRoutingQualityMetrics service function"
```

---

## Task 5: Update AdminDashboard to display the Routes tab

**Files:**
- Modify: `web-app/src/pages/AdminDashboard.tsx`

- [ ] **Step 1: Import `getRoutingQualityMetrics` and the new types**

At the top of `AdminDashboard.tsx`, update the service import (currently line 4):

```ts
import {
  getAdminStats,
  getAdminUsers,
  getRoutingQualityMetrics,
  type AdminStats,
  type AdminUser,
  type RoutingQualityMetrics,
} from '../services/adminService'
```

- [ ] **Step 2: Add `routingMetrics` state and include in the `Promise.all` fetch**

Add state below the existing `error` state:
```ts
const [routingMetrics, setRoutingMetrics] = useState<RoutingQualityMetrics | null>(null)
```

Replace the `useEffect` body so it fetches all three in parallel:
```ts
useEffect(() => {
  const token = accessToken ?? undefined
  Promise.all([
    getAdminStats(token),
    getAdminUsers(token),
    getRoutingQualityMetrics(token),
  ])
    .then(([s, u, r]) => {
      setStats(s)
      setUsers(u)
      setRoutingMetrics(r)
    })
    .catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load statistics.')
    })
    .finally(() => setIsLoading(false))
}, [accessToken])
```

- [ ] **Step 3: Add the Routes tab render branch**

The current JSX has an `activeNav === 'Overview'` branch and an else branch that shows "Coming soon". Add a new branch for `'Routes'` between the two. Replace:

```tsx
) : activeNav === 'Overview' ? (
```

…so the full conditional reads:

```tsx
) : activeNav === 'Overview' ? (
  <>
    {/* existing Overview content — unchanged */}
  </>
) : activeNav === 'Routes' ? (
  <RoutingQualityPanel metrics={routingMetrics} />
) : (
  <div className="bg-white rounded-xl shadow-sm p-10 text-center text-slate-400">
    <p className="text-3xl mb-3">🚧</p>
    <p className="font-semibold">{activeNav} — Coming soon</p>
  </div>
)
```

- [ ] **Step 4: Add the `RoutingQualityPanel` component above the `AdminDashboard` export**

Place this directly above the `export default function AdminDashboard()` line:

```tsx
function RoutingQualityPanel({ metrics }: { metrics: RoutingQualityMetrics | null }) {
  if (!metrics) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  const acceptanceRate =
    metrics.totalRidesLogged > 0
      ? `${((metrics.totalReviews / metrics.totalRidesLogged) * 100).toFixed(1)}%`
      : '—'

  const avgRating =
    metrics.overallAvgRating !== null ? `${metrics.overallAvgRating.toFixed(2)} ★` : '—'

  const showComputationTime =
    metrics.avgRouteComputationMs !== null &&
    metrics.minRouteComputationMs !== null &&
    metrics.maxRouteComputationMs !== null

  return (
    <>
      <h1 className="text-xl font-extrabold text-primary-900 mb-1">Routing Quality</h1>
      <p className="text-slate-500 text-sm mb-6">Scoring engine vs. user satisfaction · all time</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Reviews" value={metrics.totalReviews.toLocaleString()} />
        <StatCard label="Avg Rating" value={avgRating} />
        <StatCard label="Rides Logged" value={metrics.totalRidesLogged.toLocaleString()} />
        <StatCard label="Acceptance Rate" value={acceptanceRate} accent="amber" />
        <StatCard label="Generated Routes" value={metrics.totalGeneratedRoutes.toLocaleString()} />
      </div>

      {/* Computation time */}
      {showComputationTime && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="font-bold text-primary-900 mb-4">Route Computation Time (ms)</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-primary-600">
                {metrics.avgRouteComputationMs!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-500 mt-1">Average</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-600">
                {metrics.minRouteComputationMs!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-500 mt-1">Min</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-500">
                {metrics.maxRouteComputationMs!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-500 mt-1">Max</p>
            </div>
          </div>
        </div>
      )}

      {/* Route tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RouteTable title="Top Rated Routes" routes={metrics.topRatedRoutes} />
        <RouteTable title="Most Reviewed Routes" routes={metrics.mostReviewedRoutes} />
      </div>
    </>
  )
}

function RouteTable({ title, routes }: { title: string; routes: RoutingQualityMetrics['topRatedRoutes'] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h2 className="font-bold text-primary-900 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="pb-2 pr-4 font-medium">Route</th>
              <th className="pb-2 pr-4 font-medium text-right">Rating</th>
              <th className="pb-2 font-medium text-right">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400 text-sm">
                  No data yet
                </td>
              </tr>
            ) : (
              routes.map((r) => (
                <tr key={r.routeId} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-4 text-slate-700">{r.name}</td>
                  <td className="py-3 pr-4 text-primary-600 font-semibold text-right">{r.rating.toFixed(1)} ★</td>
                  <td className="py-3 text-slate-400 text-right">{r.reviewCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /path/to/repo/web-app && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Smoke-test in the browser**

```bash
VITE_USE_MOCKS=true npx vite
```

1. Open the app, log in as `admin@cyclink.com` / `CycleLink123`
2. Click "Routes" in the sidebar
3. Verify: 5 stat cards appear, computation time panel shows Avg/Min/Max, two route tables render with data
4. Verify: clicking back to "Overview" still shows the original stat cards and user table

- [ ] **Step 8: Commit**

```bash
git add web-app/src/pages/AdminDashboard.tsx
git commit -m "feat: display routing quality metrics in Routes tab"
```
