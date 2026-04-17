# Map Icon System — Design Spec
_Date: 2026-04-17_

## Overview

Replace the current ugly circle-based checkpoint markers and single restaurant-pin POI markers on the live cycling map with a cohesive, purpose-built icon system. Five distinct marker types: checkpoint (visited/unvisited), hawker centre, historic site, park, and tourist attraction.

---

## Components

### `CheckpointMarker` (`mobile/src/app/components/native/CheckpointMarker.tsx`)

Props: `{ visited: boolean }`

Renders a beacon icon using three absolute-positioned `View`s with `borderRadius`:
- Outer ring: 52×52, colour at ~22% opacity
- Middle ring: 34×34, colour at ~42% opacity
- Inner filled circle: 22×22, white 2.5px stroke

**Unvisited state:** colour `#2563eb` (blue), no checkmark.  
**Visited state:** colour `#16a34a` (green), white `MaterialCommunityIcons name="check"` centred in inner circle.

No pulse animation — animation is reserved for the rider marker.

---

### `PoiMarker` (`mobile/src/app/components/native/PoiMarker.tsx`)

Props: `{ category: PointOfInterestCategory }`

Renders a teardrop pin shape (ellipse body + triangle tail) with a white icon inside. Category drives colour and icon:

| Category | Colour | Icon (MaterialCommunityIcons) |
|---|---|---|
| `hawkerCenter` | `#ea580c` (orange) | `food` |
| `historicSite` | `#92400e` (brown) | `bank` |
| `park` | `#15803d` (green) | `tree` |
| `touristAttraction` | `#7c3aed` (purple) | `star` |

Note: verify icon names exist in the installed `@expo/vector-icons` version before coding. Swap for nearest available if not found.

White 2px stroke on the pin body. White icon at ~20px centred in body.

Visited POIs are not rendered at all — they are filtered out before `PoiMarker` is ever called.

---

## Data Changes

### `shared/types/index.ts`

Add `category` to the inline POI type on `Route`:

```ts
pointsOfInterestVisited?: Array<{
  name: string;
  description?: string;
  lat?: number;
  lng?: number;
  category?: PointOfInterestCategory;
}>;
```

### `mobile/src/services/routeService.ts` and `mobile/src/services/rideService.ts`

Both files map `points_of_interest_visited` from the backend. In every such mapping, also include the `category` field:

```ts
pointsOfInterestVisited: r.points_of_interest_visited?.map((poi) => ({
  name: poi.name,
  description: poi.description,
  lat: poi.lat,
  lng: poi.lng,
  category: poi.category ?? inferPoiCategory(poi.name),
}))
```

`inferPoiCategory(name)` is a new helper in `mobile/src/app/utils/poiLabels.ts` that returns a `PointOfInterestCategory | undefined` using name heuristics (extending the existing `isLikelyHawkerCentre` pattern).

---

## POI Visited Detection (`useLiveMapRideState.ts`)

Add state:
```ts
const [visitedPoiIndices, setVisitedPoiIndices] = useState<Set<number>>(new Set());
```

Add a `useEffect` that depends on `riderLngLat`. When it fires, iterate over `route.pointsOfInterestVisited` and compute haversine distance from `riderLngLat` to each POI. If distance ≤ 80m and the index is not already in the set, add it (via a new `Set` copy to trigger re-render).

Return `visitedPoiIndices` from the hook alongside `riderLngLat` etc.

---

## Map Rendering (`LiveMapMapbox.tsx`)

**Remove:**
- `checkpointGeo` memo + two `CircleLayer` blocks (`checkpointOuter`, `checkpointInner`)
- `foodPoiGeo` memo + `SymbolLayer` block (`foodPoiRestaurantIcon`)
- `Images` component (no longer needed once restaurant pin is removed)
- Imports: `liveMapCheckpointCollection`, `liveMapFoodPoisAlongRoute`
- Constant: `LIVE_MAP_RESTAURANT_PIN`

**Add to destructure from `useLiveMapRideState`:**
- `currentCheckpoint`
- `visitedPoiIndices`

**Add inside `<MapView>`:**

```tsx
{/* Checkpoint markers */}
{(route.checkpoints ?? []).map((cp, i) => (
  cp.lat === 0 && cp.lng === 0 ? null : (
    <MarkerView key={cp.id} coordinate={[cp.lng, cp.lat]} anchor={{ x: 0.5, y: 0.5 }}>
      <CheckpointMarker visited={i < currentCheckpoint} />
    </MarkerView>
  )
))}

{/* POI markers — disappear once visited */}
{(route.pointsOfInterestVisited ?? []).map((poi, i) => (
  visitedPoiIndices.has(i) || typeof poi.lat !== 'number' || typeof poi.lng !== 'number' || !poi.category
    ? null
    : (
      <MarkerView key={i} coordinate={[poi.lng, poi.lat]} anchor={{ x: 0.5, y: 1.0 }}>
        <PoiMarker category={poi.category} />
      </MarkerView>
    )
))}
```

---

## Cleanup

`liveMapGeojson.ts` — `liveMapCheckpointCollection` and `liveMapFoodPoisAlongRoute` / `liveMapPoiCollections` become unused. Remove them. `liveMapStartPointCollection`, `liveMapEndPointCollection`, and `liveMapRiderHaloFeature` remain.

`.gitignore` — add `.superpowers/` if not already present.

---

## Out of Scope

- Animating the disappearance of visited POI pins (fade-out) — can be added later
- Showing POIs that have no `lat`/`lng`
- Tapping a marker to see its name/description
