# Routing Quality Metrics — Admin Dashboard

**Date:** 2026-04-16  
**Branch:** improve-dashboard  
**Scope:** Web app only (admin role)

## Summary

Add a Routing Quality panel to the existing "Routes" tab of the Admin Dashboard. The tab currently renders a "Coming soon" placeholder. This spec fills it with metrics from the new `GET /admin/routing-quality-metrics` endpoint, giving tutors and admins a view of how well the scoring engine aligns with actual user satisfaction.

## Placement

The existing `Routes` nav item in the sidebar (`AdminDashboard.tsx`) is repurposed. No new sidebar items are added. The `Overview` tab is unchanged.

## API Contract

`GET /admin/routing-quality-metrics`  
Auth: `Bearer <token>` · role `admin` required

```ts
// Backend shape (snake_case, internal to adminService)
type BackendRoutingQualityMetrics = {
  total_reviews: number
  overall_avg_rating: number | null
  total_rides_logged: number
  top_rated_routes: Array<{ route_id: string; name: string; rating: number; review_count: number }>
  most_reviewed_routes: Array<{ route_id: string; name: string; rating: number; review_count: number }>
  total_generated_routes: number
  avg_route_computation_ms: number | null
  min_route_computation_ms: number | null
  max_route_computation_ms: number | null
}
```

## Frontend Type

Added to `shared/types/index.ts` under the Admin Dashboard section:

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

## Architecture

### Files to create
- None — all changes are to existing files.

### Files to modify

| File | Change |
|------|--------|
| `shared/types/index.ts` | Add `RouteEntry` and `RoutingQualityMetrics` types |
| `shared/mocks/index.ts` | Add `mockRoutingQualityMetrics` fixture |
| `web-app/src/services/localDb.ts` | Add `getStoredRoutingQualityMetrics()` + include field in `WebLocalDbState` |
| `web-app/src/services/adminService.ts` | Add `getRoutingQualityMetrics(token?)` following existing pattern |
| `web-app/src/pages/AdminDashboard.tsx` | Fetch metrics on mount; render Routes tab content |

### Data flow

1. `AdminDashboard` fetches `getRoutingQualityMetrics` in the existing `Promise.all` on mount, alongside `getAdminStats` and `getAdminUsers`. Keeps a consistent single-load pattern.
2. State: `const [routingMetrics, setRoutingMetrics] = useState<RoutingQualityMetrics | null>(null)`
3. When `activeNav === 'Routes'`, render the metrics panel (or loading spinner / error message using the same guard pattern already in place).

### Mock support

`VITE_USE_MOCKS=true` → `getRoutingQualityMetrics` returns `getStoredRoutingQualityMetrics()` from `localDb`, which seeds from `mockRoutingQualityMetrics`. Matches the existing mock pattern exactly.

## UI Layout (Routes tab)

```
[ Total Reviews ] [ Avg Rating ] [ Rides Logged ] [ Acceptance Rate* ] [ Generated Routes ]

[ Computation Time: Avg __ ms  |  Min __ ms  |  Max __ ms ]

[ Top Rated Routes table ]   [ Most Reviewed Routes table ]
```

\* Acceptance Rate = `(totalReviews / totalRidesLogged * 100).toFixed(1) + '%'`  — displayed with amber accent card to mirror the "Open Reports" warning card pattern. Shows `—` if `totalRidesLogged === 0`.

**Null handling:**
- `overallAvgRating === null` → show `—` in the Avg Rating card
- All three computation ms fields `=== null` → hide the computation time panel entirely (no empty placeholders)
- `topRatedRoutes` or `mostReviewedRoutes` empty → show a small `No data yet` row in the table

## Error handling

Reuses the existing `error` state string and red banner already rendered in `AdminDashboard`. A failure in `getRoutingQualityMetrics` sets the same `error` string. Partial failures (one of the three parallel fetches fails) still show an error — consistent with the current all-or-nothing `Promise.all`.

## Out of scope

- Sorting or filtering the route tables interactively
- Pagination
- Any changes to the Overview, Users, Reports, or Settings tabs
