# Map Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ugly CircleLayer checkpoint dots and single restaurant-pin POI markers on the live cycling map with a beacon-style CheckpointMarker and category-specific teardrop PoiMarker components.

**Architecture:** Two new React Native components (`CheckpointMarker`, `PoiMarker`) rendered via Mapbox `MarkerView`; checkpoint visited state driven by the existing `currentCheckpoint` index; POI visited state driven by a new proximity effect in `useLiveMapRideState` that disappears markers once the rider passes within 80 m. Category is mapped from the backend response with a name-heuristic fallback.

**Tech Stack:** React Native, `@rnmapbox/maps` `MarkerView`, `@expo/vector-icons` MaterialCommunityIcons, `@testing-library/react-native`, Jest/jest-expo.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `mobile/src/app/utils/poiLabels.ts` | Modify | Add `inferPoiCategory` heuristic |
| `mobile/src/app/utils/poiLabels.test.ts` | Create | Tests for `inferPoiCategory` |
| `shared/types/index.ts` | Modify | Add `category?` to POI item type |
| `mobile/src/services/routeService.ts` | Modify | Map `category` from backend POI payloads |
| `mobile/src/services/rideService.ts` | Modify | Map `category` in both POI mapping spots |
| `mobile/src/services/rideService.test.ts` | Modify | Assert `category` is preserved |
| `mobile/src/app/components/native/CheckpointMarker.tsx` | Create | Beacon component (visited/unvisited) |
| `mobile/src/app/components/native/CheckpointMarker.test.tsx` | Create | Tests for CheckpointMarker |
| `mobile/src/app/components/native/PoiMarker.tsx` | Create | Teardrop pin per POI category |
| `mobile/src/app/components/native/PoiMarker.test.tsx` | Create | Tests for PoiMarker |
| `mobile/src/app/pages/useLiveMapRideState.ts` | Modify | Add `visitedPoiIndices` state + proximity effect |
| `mobile/src/app/pages/useLiveMapRideState.test.tsx` | Modify | Test POI disappear-on-proximity |
| `mobile/src/utils/liveMapGeojson.ts` | Modify | Remove three unused functions |
| `mobile/src/app/pages/LiveMapMapbox.tsx` | Modify | Replace layers with MarkerView components |

---

## Task 1: `inferPoiCategory` helper

**Files:**
- Modify: `mobile/src/app/utils/poiLabels.ts`
- Create: `mobile/src/app/utils/poiLabels.test.ts`

- [ ] **Step 1.1 — Write the failing test**

Create `mobile/src/app/utils/poiLabels.test.ts`:

```ts
import { inferPoiCategory, isLikelyHawkerCentre } from './poiLabels';

describe('isLikelyHawkerCentre', () => {
  it('matches hawker keywords', () => {
    expect(isLikelyHawkerCentre('Lau Pa Sat Hawker Centre')).toBe(true);
    expect(isLikelyHawkerCentre('Maxwell Food Centre')).toBe(true);
    expect(isLikelyHawkerCentre('Old Airport Kopitiam')).toBe(true);
    expect(isLikelyHawkerCentre('Merlion Park')).toBe(false);
  });
});

describe('inferPoiCategory', () => {
  it('returns hawkerCenter for hawker/food-centre names', () => {
    expect(inferPoiCategory('Lau Pa Sat Hawker Centre')).toBe('hawkerCenter');
    expect(inferPoiCategory('Maxwell Food Centre')).toBe('hawkerCenter');
  });

  it('returns historicSite for museum/fort/heritage names', () => {
    expect(inferPoiCategory('National Museum of Singapore')).toBe('historicSite');
    expect(inferPoiCategory('Fort Canning Park')).toBe('historicSite');
    expect(inferPoiCategory('Sri Mariamman Temple')).toBe('historicSite');
  });

  it('returns park for park/garden/nature names', () => {
    expect(inferPoiCategory('East Coast Park')).toBe('park');
    expect(inferPoiCategory('Botanic Gardens')).toBe('park');
    expect(inferPoiCategory('Sungei Buloh Wetland Reserve')).toBe('park');
  });

  it('returns touristAttraction for landmark names', () => {
    expect(inferPoiCategory('Merlion Park')).toBe('touristAttraction');
    expect(inferPoiCategory('Singapore Zoo')).toBe('touristAttraction');
    expect(inferPoiCategory('Marina Bay Sands SkyPark')).toBe('touristAttraction');
  });

  it('returns undefined for unrecognised names', () => {
    expect(inferPoiCategory('Some Random Place')).toBeUndefined();
  });
});
```

- [ ] **Step 1.2 — Run test to verify it fails**

```bash
cd mobile && npx jest --watchman=false poiLabels.test --no-coverage
```

Expected: `Cannot find module` or `inferPoiCategory is not exported`.

- [ ] **Step 1.3 — Implement `inferPoiCategory`**

Replace the contents of `mobile/src/app/utils/poiLabels.ts`:

```ts
import type { PointOfInterestCategory } from '../../../../shared/types/index';

/** Heuristic: hawker centres often appear in POI names when the API does not send a category. */
export function isLikelyHawkerCentre(name: string): boolean {
  const n = name.toLowerCase();
  return (
    /\bhawker\b/.test(n) ||
    /\bfood\s*cent(?:re|er)\b/.test(n) ||
    /\bkopitiam\b/.test(n)
  );
}

/**
 * Infers a PointOfInterestCategory from a POI name.
 * Used as a fallback when the backend does not include a category field.
 * Returns undefined if no category can be inferred.
 */
export function inferPoiCategory(name: string): PointOfInterestCategory | undefined {
  if (isLikelyHawkerCentre(name)) return 'hawkerCenter';

  const n = name.toLowerCase();

  if (
    /\bmuseum\b/.test(n) ||
    /\bfort\b/.test(n) ||
    /\bheritage\b/.test(n) ||
    /\btemple\b/.test(n) ||
    /\bmosque\b/.test(n) ||
    /\bchurch\b/.test(n) ||
    /\bcathedral\b/.test(n) ||
    /\bmonument\b/.test(n) ||
    /\bmemorial\b/.test(n) ||
    /\bhistoric\b/.test(n)
  ) {
    return 'historicSite';
  }

  if (
    /\bpark\b/.test(n) ||
    /\bgarden\b/.test(n) ||
    /\breserve\b/.test(n) ||
    /\bnature\b/.test(n) ||
    /\bwetland\b/.test(n) ||
    /\bforest\b/.test(n)
  ) {
    return 'park';
  }

  if (
    /\bzoo\b/.test(n) ||
    /\baquarium\b/.test(n) ||
    /\bskypark\b/.test(n) ||
    /\buniversal\b/.test(n) ||
    /\bmerlion\b/.test(n) ||
    /\bsafari\b/.test(n) ||
    /\btheme\s*park\b/.test(n)
  ) {
    return 'touristAttraction';
  }

  return undefined;
}
```

- [ ] **Step 1.4 — Run test to verify it passes**

```bash
cd mobile && npx jest --watchman=false poiLabels.test --no-coverage
```

Expected: all 5 tests PASS.

- [ ] **Step 1.5 — Commit**

```bash
cd mobile && git add src/app/utils/poiLabels.ts src/app/utils/poiLabels.test.ts && git commit -m "feat: add inferPoiCategory heuristic helper"
```

---

## Task 2: Add `category` to shared POI type

**Files:**
- Modify: `shared/types/index.ts:153`

- [ ] **Step 2.1 — Update the type**

In `shared/types/index.ts`, find the `Route` type. Change the `pointsOfInterestVisited` field from:

```ts
pointsOfInterestVisited?: Array<{ name: string; description?: string; lat?: number; lng?: number }>;
```

To:

```ts
pointsOfInterestVisited?: Array<{
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  category?: PointOfInterestCategory;
}>;
```

- [ ] **Step 2.2 — Verify TypeScript compiles**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors (there may be pre-existing warnings, that's fine).

- [ ] **Step 2.3 — Commit**

```bash
git add shared/types/index.ts && git commit -m "feat: add category field to Route pointsOfInterestVisited type"
```

---

## Task 3: Map `category` in the service layer

**Files:**
- Modify: `mobile/src/services/routeService.ts`
- Modify: `mobile/src/services/rideService.ts`
- Modify: `mobile/src/services/rideService.test.ts`

### 3a — `rideService.ts`

- [ ] **Step 3a.1 — Write the failing test**

In `mobile/src/services/rideService.test.ts`, add this test inside the existing `describe` block, after the current tests:

```ts
it('maps category from backend POI data', async () => {
  const backendRideWithCategory = {
    ...backendRide,
    points_of_interest_visited: [
      { name: 'Maxwell Food Centre', description: 'Hawker', lat: 1.281, lng: 103.851, category: 'hawkerCenter' },
    ],
  };
  mockGet.mockResolvedValueOnce(backendRideWithCategory);
  const history = await getRideHistory();
  expect(history[0].pointsOfInterestVisited?.[0].category).toBe('hawkerCenter');
});

it('infers category from name when backend omits it', async () => {
  const backendRideNoCategory = {
    ...backendRide,
    points_of_interest_visited: [
      { name: 'Maxwell Food Centre', description: 'Hawker', lat: 1.281, lng: 103.851 },
    ],
  };
  mockGet.mockResolvedValueOnce(backendRideNoCategory);
  const history = await getRideHistory();
  expect(history[0].pointsOfInterestVisited?.[0].category).toBe('hawkerCenter');
});
```

You will also need to make sure `getRideHistory` is imported at the top of the test file. Check the current imports — if it's not there yet, add it:

```ts
import { getRideHistory, saveRide } from './rideService';
```

- [ ] **Step 3a.2 — Run test to verify it fails**

```bash
cd mobile && npx jest --watchman=false rideService.test --no-coverage
```

Expected: the two new tests FAIL (category is undefined).

- [ ] **Step 3a.3 — Update `rideService.ts` mapping**

In `mobile/src/services/rideService.ts`, add the import for `inferPoiCategory` near the top:

```ts
import { inferPoiCategory } from '../app/utils/poiLabels';
```

Then find the two `points_of_interest_visited` mappings (around lines 185 and 222) and update both to include `category`:

**First mapping (around line 185):**
```ts
pointsOfInterestVisited: r.points_of_interest_visited?.map((poi) => ({
  name: poi.name,
  description: poi.description,
  lat: poi.lat,
  lng: poi.lng,
  category: (poi.category as import('../../../shared/types/index').PointOfInterestCategory | undefined) ?? inferPoiCategory(poi.name),
})),
```

**Second mapping (around line 222, inside `routeDetails`):**
```ts
pointsOfInterestVisited: r.route_details.points_of_interest_visited?.map((poi) => ({
  name: poi.name,
  description: poi.description,
  lat: poi.lat,
  lng: poi.lng,
  category: (poi.category as import('../../../shared/types/index').PointOfInterestCategory | undefined) ?? inferPoiCategory(poi.name),
})),
```

To avoid the verbose inline import, add `PointOfInterestCategory` to the existing import from shared types at the top of `rideService.ts`:

```ts
import type { Route, PointOfInterestCategory } from '../../../shared/types/index';
```

Then use `PointOfInterestCategory` directly in the cast:

```ts
category: (poi.category as PointOfInterestCategory | undefined) ?? inferPoiCategory(poi.name),
```

Also add `category?: string` to the backend POI types inside `rideService.ts`. Find the type for `points_of_interest_visited` items (there are two inline array types) and add `category?: string` to each:

```ts
// Near line 87 (BackendRide type):
points_of_interest_visited?: Array<{
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  category?: string;
}>;

// And the same for route_details.points_of_interest_visited (around line 156 in BackendSavedRoute)
```

- [ ] **Step 3a.4 — Run test to verify it passes**

```bash
cd mobile && npx jest --watchman=false rideService.test --no-coverage
```

Expected: all tests PASS.

### 3b — `routeService.ts`

- [ ] **Step 3b.1 — Update `routeService.ts`**

In `mobile/src/services/routeService.ts`:

1. Add `PointOfInterestCategory` and `inferPoiCategory` imports at top:

```ts
import type { PointOfInterestCategory } from '../../../shared/types/index';
import { inferPoiCategory } from '../app/utils/poiLabels';
```

2. Add `category?: string` to the `BackendRouteResponse` POI type (around line 61):

```ts
points_of_interest_visited?: Array<{
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  category?: string;
}>;
```

3. In `mapBackendRouteResponse` (around line 280), change the direct pass-through:

```ts
// Before:
pointsOfInterestVisited: r.points_of_interest_visited,

// After:
pointsOfInterestVisited: r.points_of_interest_visited?.map((poi) => ({
  name: poi.name,
  description: poi.description,
  lat: poi.lat,
  lng: poi.lng,
  category: (poi.category as PointOfInterestCategory | undefined) ?? inferPoiCategory(poi.name),
})),
```

4. In `toFrontendRecommendedRoute` (around line 395), update the `pointsOfInterestVisited` assignment to add category inference after normalization:

```ts
// Before:
const pointsOfInterestVisited =
  normalizeVisitedPoiNames(route.points_of_interest_visited) ??
  normalizeVisitedPoiNames(route.visited_points_of_interest) ??
  normalizeVisitedPoiNames(route.points_of_interest);

// After:
const rawPois =
  normalizeVisitedPoiNames(route.points_of_interest_visited) ??
  normalizeVisitedPoiNames(route.visited_points_of_interest) ??
  normalizeVisitedPoiNames(route.points_of_interest);
const pointsOfInterestVisited = rawPois?.map((poi) => ({
  ...poi,
  category: inferPoiCategory(poi.name),
}));
```

- [ ] **Step 3b.2 — Verify TypeScript and existing tests pass**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -30 && npx jest --watchman=false routeService.test rideService.test --no-coverage
```

Expected: no TS errors, all tests PASS.

- [ ] **Step 3b.3 — Commit**

```bash
cd mobile && git add src/services/routeService.ts src/services/rideService.ts src/services/rideService.test.ts && git commit -m "feat: map POI category field in routeService and rideService"
```

---

## Task 4: `CheckpointMarker` component

**Files:**
- Create: `mobile/src/app/components/native/CheckpointMarker.tsx`
- Create: `mobile/src/app/components/native/CheckpointMarker.test.tsx`

- [ ] **Step 4.1 — Write the failing test**

Create `mobile/src/app/components/native/CheckpointMarker.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CheckpointMarker from './CheckpointMarker';

describe('CheckpointMarker', () => {
  it('does not show checkmark when unvisited', () => {
    render(<CheckpointMarker visited={false} />);
    expect(screen.queryByTestId('checkpoint-marker-check')).toBeNull();
  });

  it('shows checkmark when visited', () => {
    render(<CheckpointMarker visited={true} />);
    expect(screen.getByTestId('checkpoint-marker-check')).toBeTruthy();
  });

  it('uses blue core when unvisited', () => {
    render(<CheckpointMarker visited={false} />);
    const inner = screen.getByTestId('checkpoint-marker-inner');
    expect(inner.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#2563eb' }),
      ])
    );
  });

  it('uses green core when visited', () => {
    render(<CheckpointMarker visited={true} />);
    const inner = screen.getByTestId('checkpoint-marker-inner');
    expect(inner.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#16a34a' }),
      ])
    );
  });
});
```

- [ ] **Step 4.2 — Run test to verify it fails**

```bash
cd mobile && npx jest --watchman=false CheckpointMarker.test --no-coverage
```

Expected: `Cannot find module './CheckpointMarker'`.

- [ ] **Step 4.3 — Implement `CheckpointMarker`**

Create `mobile/src/app/components/native/CheckpointMarker.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CheckpointMarkerProps {
  visited: boolean;
}

export default function CheckpointMarker({ visited }: CheckpointMarkerProps) {
  const haloColor = visited ? 'rgba(22,163,74,0.22)' : 'rgba(37,99,235,0.22)';
  const midColor = visited ? 'rgba(22,163,74,0.42)' : 'rgba(37,99,235,0.42)';
  const coreColor = visited ? '#16a34a' : '#2563eb';

  return (
    <View style={styles.container}>
      <View style={[styles.outerHalo, { backgroundColor: haloColor }]} />
      <View style={[styles.midRing, { backgroundColor: midColor }]} />
      <View
        testID="checkpoint-marker-inner"
        style={[styles.innerCircle, { backgroundColor: coreColor }]}
      >
        {visited && (
          <MaterialCommunityIcons
            testID="checkpoint-marker-check"
            name="check"
            size={12}
            color="#ffffff"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerHalo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  midRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  innerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4.4 — Run test to verify it passes**

```bash
cd mobile && npx jest --watchman=false CheckpointMarker.test --no-coverage
```

Expected: all 4 tests PASS.

- [ ] **Step 4.5 — Commit**

```bash
cd mobile && git add src/app/components/native/CheckpointMarker.tsx src/app/components/native/CheckpointMarker.test.tsx && git commit -m "feat: add CheckpointMarker beacon component"
```

---

## Task 5: `PoiMarker` component

**Files:**
- Create: `mobile/src/app/components/native/PoiMarker.tsx`
- Create: `mobile/src/app/components/native/PoiMarker.test.tsx`

- [ ] **Step 5.1 — Write the failing test**

Create `mobile/src/app/components/native/PoiMarker.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PoiMarker from './PoiMarker';

const COLORS = {
  hawkerCenter: '#ea580c',
  historicSite: '#92400e',
  park: '#15803d',
  touristAttraction: '#7c3aed',
} as const;

describe('PoiMarker', () => {
  (Object.keys(COLORS) as Array<keyof typeof COLORS>).forEach((category) => {
    it(`renders the correct pin colour for ${category}`, () => {
      render(<PoiMarker category={category} />);
      const head = screen.getByTestId('poi-marker-head');
      expect(head.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: COLORS[category] }),
        ])
      );
    });
  });
});
```

- [ ] **Step 5.2 — Run test to verify it fails**

```bash
cd mobile && npx jest --watchman=false PoiMarker.test --no-coverage
```

Expected: `Cannot find module './PoiMarker'`.

- [ ] **Step 5.3 — Implement `PoiMarker`**

Create `mobile/src/app/components/native/PoiMarker.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { PointOfInterestCategory } from '../../../../../shared/types/index';

interface PoiMarkerProps {
  category: PointOfInterestCategory;
}

const CATEGORY_CONFIG: Record<PointOfInterestCategory, { color: string; icon: string }> = {
  hawkerCenter: { color: '#ea580c', icon: 'food' },
  historicSite: { color: '#92400e', icon: 'bank' },
  park: { color: '#15803d', icon: 'tree' },
  touristAttraction: { color: '#7c3aed', icon: 'star' },
};

export default function PoiMarker({ category }: PoiMarkerProps) {
  const { color, icon } = CATEGORY_CONFIG[category];

  return (
    <View style={styles.container}>
      <View
        testID="poi-marker-head"
        style={[styles.pinHead, { backgroundColor: color }]}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color="#ffffff" />
      </View>
      <View style={[styles.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
});
```

- [ ] **Step 5.4 — Run test to verify it passes**

```bash
cd mobile && npx jest --watchman=false PoiMarker.test --no-coverage
```

Expected: all 4 tests PASS.

- [ ] **Step 5.5 — Commit**

```bash
cd mobile && git add src/app/components/native/PoiMarker.tsx src/app/components/native/PoiMarker.test.tsx && git commit -m "feat: add PoiMarker teardrop pin component"
```

---

## Task 6: POI visited detection in `useLiveMapRideState`

**Files:**
- Modify: `mobile/src/app/pages/useLiveMapRideState.ts`
- Modify: `mobile/src/app/pages/useLiveMapRideState.test.tsx`

- [ ] **Step 6.1 — Write the failing test**

In `mobile/src/app/pages/useLiveMapRideState.test.tsx`, add a new `describe` block at the end of the file:

```tsx
describe('POI visited detection', () => {
  // POI coordinates are in Singapore — clearly separated from the mockRoutes[1]
  // start point (Times Square, ~40.76°N 73.99°W) so proximity checks don't
  // accidentally fire during the "far away" test.
  const routeWithPoi = {
    ...mockRoutes[1],
    pointsOfInterestVisited: [
      {
        name: 'Maxwell Food Centre',
        description: 'Hawker',
        lat: 1.2801,
        lng: 103.8454,
        category: 'hawkerCenter' as const,
      },
      {
        name: 'Far Away Place',
        description: 'Not nearby',
        lat: 1.3,
        lng: 104.0,
        category: 'park' as const,
      },
    ],
  };

  it('adds a POI index to visitedPoiIndices when the rider is within 80 m', async () => {
    // Position the rider exactly at the first POI (Singapore coords)
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: { latitude: 1.2801, longitude: 103.8454, accuracy: 5 },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
      async (_opts: unknown, cb: (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void) => {
        cb({ coords: { latitude: 1.2801, longitude: 103.8454, accuracy: 5 } });
        return { remove: jest.fn() };
      }
    );

    const { result } = renderHook(() =>
      useLiveMapRideState(routeWithPoi.id, routeWithPoi)
    );

    await waitFor(() => {
      expect(result.current.visitedPoiIndices.has(0)).toBe(true);
    });

    // The far-away POI should still be unvisited
    expect(result.current.visitedPoiIndices.has(1)).toBe(false);
  });

  it('does not add a POI when rider is far away', async () => {
    // Rider is at the route start, far from both POIs
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValueOnce({
      coords: {
        latitude: routeWithPoi.startPoint.lat,
        longitude: routeWithPoi.startPoint.lng,
        accuracy: 5,
      },
    });
    (Location.watchPositionAsync as jest.Mock).mockImplementationOnce(
      async (_opts: unknown, cb: (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void) => {
        cb({ coords: { latitude: routeWithPoi.startPoint.lat, longitude: routeWithPoi.startPoint.lng, accuracy: 5 } });
        return { remove: jest.fn() };
      }
    );

    const { result } = renderHook(() =>
      useLiveMapRideState(routeWithPoi.id, routeWithPoi)
    );

    // Give it a tick to stabilise
    await waitFor(() => expect(result.current.route).toBeTruthy());

    expect(result.current.visitedPoiIndices.size).toBe(0);
  });
});
```

- [ ] **Step 6.2 — Run test to verify it fails**

```bash
cd mobile && npx jest --watchman=false useLiveMapRideState.test --no-coverage 2>&1 | tail -20
```

Expected: the two new tests FAIL with `visitedPoiIndices is not a function` or `undefined`.

- [ ] **Step 6.3 — Add `visitedPoiIndices` state and proximity effect**

In `mobile/src/app/pages/useLiveMapRideState.ts`:

1. Add state declaration after the `checkpointBanner` state (around line 65):

```ts
const [visitedPoiIndices, setVisitedPoiIndices] = useState<Set<number>>(new Set());
```

2. Add the proximity effect after the `currentCheckpoint` memo (around line 554):

```ts
useEffect(() => {
  if (!riderLngLat || !route?.pointsOfInterestVisited?.length) return;

  const pois = route.pointsOfInterestVisited;
  let anyNew = false;
  const next = new Set(visitedPoiIndices);

  pois.forEach((poi, i) => {
    if (next.has(i)) return;
    if (typeof poi.lat !== 'number' || typeof poi.lng !== 'number') return;
    const distKm = haversineDistanceKm(riderLngLat, [poi.lng, poi.lat]);
    if (distKm <= 0.08) {
      next.add(i);
      anyNew = true;
    }
  });

  if (anyNew) {
    setVisitedPoiIndices(next);
  }
}, [riderLngLat, route, visitedPoiIndices]);
```

3. Add `visitedPoiIndices` to the return object (in the `return { ... }` block at the bottom):

```ts
visitedPoiIndices,
```

- [ ] **Step 6.4 — Run test to verify it passes**

```bash
cd mobile && npx jest --watchman=false useLiveMapRideState.test --no-coverage
```

Expected: all tests PASS (including the pre-existing ones).

- [ ] **Step 6.5 — Commit**

```bash
cd mobile && git add src/app/pages/useLiveMapRideState.ts src/app/pages/useLiveMapRideState.test.tsx && git commit -m "feat: add visitedPoiIndices proximity detection to useLiveMapRideState"
```

---

## Task 7: Wire up `LiveMapMapbox.tsx` and clean up `liveMapGeojson.ts`

**Files:**
- Modify: `mobile/src/app/pages/LiveMapMapbox.tsx`
- Modify: `mobile/src/utils/liveMapGeojson.ts`

Note: `LiveMapMapbox.tsx` is a render-heavy screen component. There is no unit test for it. Verify visually by running the app with `npx expo start` after this task.

- [ ] **Step 7.1 — Clean up `liveMapGeojson.ts`**

In `mobile/src/utils/liveMapGeojson.ts`, remove the three functions that will no longer be used: `liveMapCheckpointCollection`, `liveMapPoiCollections`, and `liveMapFoodPoisAlongRoute`. The file should only export `liveMapStartPointCollection`, `liveMapEndPointCollection`, and `liveMapRiderHaloFeature`.

The final file:

```ts
import type { Route } from '../../../shared/types/index';
import type { LngLat } from './routeGeometry';

export type PointFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, string | undefined>;
    geometry: { type: 'Point'; coordinates: LngLat };
  }>;
};

function emptyPointCollection(): PointFeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

export function liveMapRiderHaloFeature(coords: LngLat) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Point' as const, coordinates: coords },
  };
}

/** Single-point collection for route start (green marker on live map). */
export function liveMapStartPointCollection(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const { lat, lng, name } = route.startPoint;
  if (lat === 0 && lng === 0) return emptyPointCollection();
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        properties: { title: name, kind: 'start' as const },
        geometry: { type: 'Point' as const, coordinates: [lng, lat] as LngLat },
      },
    ],
  };
}

/** Single-point collection for route end (red marker on live map). */
export function liveMapEndPointCollection(route: Route | null): PointFeatureCollection {
  if (!route) return emptyPointCollection();
  const { lat, lng, name } = route.endPoint;
  if (lat === 0 && lng === 0) return emptyPointCollection();
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        properties: { title: name, kind: 'end' as const },
        geometry: { type: 'Point' as const, coordinates: [lng, lat] as LngLat },
      },
    ],
  };
}
```

- [ ] **Step 7.2 — Update `LiveMapMapbox.tsx` imports**

At the top of `mobile/src/app/pages/LiveMapMapbox.tsx`:

1. Remove `Images`, `SymbolLayer` from the `@rnmapbox/maps` import (they are no longer needed). Keep `Camera`, `CircleLayer`, `LineLayer`, `MapView`, `MarkerView`, `ShapeSource`, `StyleURL`, `setAccessToken`.

2. Remove the import of `liveMapCheckpointCollection` and `liveMapFoodPoisAlongRoute`:

```ts
// Remove these two from the liveMapGeojson import:
// liveMapCheckpointCollection,
// liveMapFoodPoisAlongRoute,
```

3. Add imports for the two new components:

```ts
import CheckpointMarker from '../components/native/CheckpointMarker';
import PoiMarker from '../components/native/PoiMarker';
```

4. Remove the PNG require at the top:

```ts
// Remove this line:
// const LIVE_MAP_RESTAURANT_PIN = require('../../../assets/live-map-restaurant-pin.png');
```

- [ ] **Step 7.3 — Update destructure from `useLiveMapRideState`**

In the `useLiveMapRideState` destructure, add `currentCheckpoint` and `visitedPoiIndices`:

```ts
const {
  route,
  routeLoading,
  progress,
  elapsedSec,
  routeCompleted,
  checkpointsVisitedCount,
  isPaused,
  currentCheckpoint,        // add this
  visitedPoiIndices,        // add this
  checkpointBanner,
  // ... rest unchanged
} = useLiveMapRideState(routeId, routeParam);
```

- [ ] **Step 7.4 — Remove old memos and update `foodPoiGeo`**

Remove these three `useMemo` lines (they reference functions no longer exported):

```ts
// Remove:
// const checkpointGeo = useMemo(() => liveMapCheckpointCollection(route), [route]);
// const foodPoiGeo = useMemo(() => liveMapFoodPoisAlongRoute(route), [route]);
```

(`startPointGeo` and `endPointGeo` remain.)

- [ ] **Step 7.5 — Replace the old map layers inside `<MapView>`**

Inside the `<MapView>` block, make these changes:

**Remove** the entire `<Images .../>` component:
```tsx
// Remove:
// <Images images={{ liveMapRestaurantPin: LIVE_MAP_RESTAURANT_PIN }} />
```

**Remove** the checkpoint `ShapeSource` block (the one with `checkpointOuter` and `checkpointInner`):
```tsx
// Remove:
// {checkpointGeo.features.length > 0 ? (
//   <ShapeSource id="liveMapCheckpoints" shape={checkpointGeo}>
//     <CircleLayer id="checkpointOuter" ... />
//     <CircleLayer id="checkpointInner" ... />
//   </ShapeSource>
// ) : null}
```

**Remove** the food POI `ShapeSource` block:
```tsx
// Remove:
// {foodPoiGeo.features.length > 0 ? (
//   <ShapeSource id="liveMapFoodPois" shape={foodPoiGeo}>
//     <SymbolLayer id="foodPoiRestaurantIcon" ... />
//   </ShapeSource>
// ) : null}
```

**Add** the new checkpoint markers, placed just before the `riderHasFix` MarkerView block:

```tsx
{(route.checkpoints ?? []).map((cp, i) =>
  cp.lat === 0 && cp.lng === 0 ? null : (
    <MarkerView key={cp.id} coordinate={[cp.lng, cp.lat]} anchor={{ x: 0.5, y: 0.5 }}>
      <CheckpointMarker visited={i < currentCheckpoint} />
    </MarkerView>
  )
)}

{(route.pointsOfInterestVisited ?? []).map((poi, i) =>
  visitedPoiIndices.has(i) ||
  typeof poi.lat !== 'number' ||
  typeof poi.lng !== 'number' ||
  !poi.category ? null : (
    <MarkerView key={`poi-${i}`} coordinate={[poi.lng, poi.lat]} anchor={{ x: 0.5, y: 1.0 }}>
      <PoiMarker category={poi.category} />
    </MarkerView>
  )
)}
```

- [ ] **Step 7.6 — Verify TypeScript compiles**

```bash
cd mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

- [ ] **Step 7.7 — Run full test suite**

```bash
cd mobile && npx jest --watchman=false --no-coverage 2>&1 | tail -20
```

Expected: all tests PASS.

- [ ] **Step 7.8 — Commit**

```bash
cd mobile && git add src/app/pages/LiveMapMapbox.tsx src/utils/liveMapGeojson.ts && git commit -m "feat: replace CircleLayer/SymbolLayer markers with CheckpointMarker and PoiMarker"
```

---

## Final check: `.gitignore`

- [ ] Verify `.superpowers/` is in the root `.gitignore`. If not, add it:

```bash
grep -q '.superpowers' /Users/alekkwek/Documents/GitHub/frontend/.gitignore || echo '.superpowers/' >> /Users/alekkwek/Documents/GitHub/frontend/.gitignore && git add .gitignore && git commit -m "chore: ignore .superpowers brainstorm directory"
```
